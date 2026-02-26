import { POST } from '@/app/api/auth/login/route';
import { db } from '@/db/kysely/client';
import { hashPassword } from '@/lib/auth/password';
import { testUser, testAdmin, createMockRequest } from './helpers';
import { Errors } from '@/lib/errors';

/*
1. Test successful login:
    - Create a test user in the database.
    - Mock a NextRequest with correct credentials.
    - Call the POST function and expect a 200 response with user data and session cookie.

2. Test failed login with incorrect password:
    - Mock a NextRequest with correct email but wrong password.
    - Call the POST function and expect a 401 response with INVALID_CREDENTIALS error.

3. Test failed login with non-existent email or username:
    - Mock a NextRequest with an email that doesn't exist in the database.
    - Call the POST function and expect a 401 response with INVALID_CREDENTIALS error.

4. Test input validation:
    - Mock NextRequests with various invalid inputs (empty identifier, empty password, missing fields).
    - Call the POST function and expect a 400 response with Invalid Input error.

5. Test rate limiting:
    - Mock multiple failed login attempts from the same IP and identifier.
    - After 5 failed attempts, call the POST function again and expect a 429 response with TOO_MANY_REQUESTS error.

6. Test request headers:
    - Mock a NextRequest with custom x-forwarded-for and user-agent headers.
    - Call the POST function and verify that the login attempt is recorded with the correct IP and user agent in the database.

7. Test session creation:
    - Mock a NextRequest with correct credentials.
    - Call the POST function and verify that a session cookie is set with the correct attributes (HttpOnly, SameSite, Secure in production).
*/

describe('Login Tests', () => {
  // Setup: Create test users before all tests
  beforeAll(async () => {
    const userPasswordHash = await hashPassword(testUser.password);
    const adminPasswordHash = await hashPassword(testAdmin.password);

    // Insert test users
    await db
      .insertInto('users')
      .values({
        id: testUser.id,
        email: testUser.email,
        username: testUser.username,
        password_hash: userPasswordHash,
        system_role: testUser.system_role,
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();

    await db
      .insertInto('users')
      .values({
        id: testAdmin.id,
        email: testAdmin.email,
        username: testAdmin.username,
        password_hash: adminPasswordHash,
        system_role: testAdmin.system_role,
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();

    console.log('[Test Setup] Test users created');
  });

  // Cleanup: Clear login attempts before each test
  beforeEach(async () => {
    await db
      .deleteFrom('login_attempts')
      .where('identifier', 'in', [
        testUser.email,
        testUser.username,
        testAdmin.email,
        testAdmin.username,
        'nonexistent@example.com',
        'wronguser',
        'ratelimit@example.com',
      ])
      .execute();
  });

  // Teardown: Remove test users after all tests
  afterAll(async () => {
    await db.deleteFrom('users').where('id', 'in', [testUser.id, testAdmin.id]).execute();
    await db
      .deleteFrom('login_attempts')
      .where('identifier', 'in', [
        testUser.email,
        testUser.username,
        testAdmin.email,
        testAdmin.username,
        'nonexistent@example.com',
        'wronguser',
        'ratelimit@example.com',
      ])
      .execute();
    console.log('[Test Teardown] Test users and login attempts cleaned up');

    // Close database connection pool to prevent Jest from hanging
    await db.destroy();
  });

  describe('Successful Login Scenarios', () => {
    test('should successfully login with correct email and password', async () => {
      const request = createMockRequest({
        credentials: {
          identifier: testUser.email,
          password: testUser.password,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        username: testUser.username,
        system_role: testUser.system_role,
      });
      expect(data.user.password_hash).toBeUndefined();

      // Verify session cookie is set
      const setCookieHeader = response.headers.get('set-cookie');
      expect(setCookieHeader).toContain('session');

      // Verify login attempt was recorded as successful
      const loginAttempt = await db
        .selectFrom('login_attempts')
        .selectAll()
        .where('identifier', '=', testUser.email)
        .where('successful', '=', true)
        .orderBy('attempt_at', 'desc')
        .executeTakeFirst();

      expect(loginAttempt).toBeDefined();
      expect(loginAttempt?.successful).toBe(true);
    });

    test('should successfully login with correct username and password', async () => {
      const request = createMockRequest({
        credentials: {
          identifier: testUser.username,
          password: testUser.password,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        username: testUser.username,
      });
    });

    test('should successfully login admin user', async () => {
      const request = createMockRequest({
        credentials: {
          identifier: testAdmin.email,
          password: testAdmin.password,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toMatchObject({
        id: testAdmin.id,
        email: testAdmin.email,
        username: testAdmin.username,
        system_role: 'sysadmin',
      });
    });

    test('should clear failed attempts after successful login', async () => {
      // Create some failed attempts first
      await db
        .insertInto('login_attempts')
        .values([
          {
            ip_address: '127.0.0.1',
            user_agent: 'jest-test-runner',
            identifier: testUser.email,
            successful: false,
            error_message: 'Invalid credentials',
          },
          {
            ip_address: '127.0.0.1',
            user_agent: 'jest-test-runner',
            identifier: testUser.email,
            successful: false,
            error_message: 'Invalid credentials',
          },
        ])
        .execute();

      // Successful login
      const request = createMockRequest({
        credentials: {
          identifier: testUser.email,
          password: testUser.password,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      // Verify failed attempts were cleared
      const failedAttempts = await db
        .selectFrom('login_attempts')
        .selectAll()
        .where('identifier', '=', testUser.email)
        .where('successful', '=', false)
        .execute();

      expect(failedAttempts).toHaveLength(0);
    });
  });

  describe('Failed Login Scenarios', () => {
    test('should fail login with incorrect password', async () => {
      const request = createMockRequest({
        credentials: {
          identifier: testUser.email,
          password: 'WrongPassword123!',
        },
      });

      const response = await POST(request);
      const data = await response.json();
      const { message, statusCode } = Errors.INVALID_CREDENTIALS;

      expect(response.status).toBe(statusCode);
      expect(data.error).toBe(message);

      // Verify failed login attempt was recorded
      const loginAttempt = await db
        .selectFrom('login_attempts')
        .selectAll()
        .where('identifier', '=', testUser.email)
        .where('successful', '=', false)
        .orderBy('attempt_at', 'desc')
        .executeTakeFirst();

      expect(loginAttempt).toBeDefined();
      expect(loginAttempt?.successful).toBe(false);
      expect(loginAttempt?.error_message).toBe(message);
    });

    test('should fail login with non-existent email', async () => {
      const request = createMockRequest({
        credentials: {
          identifier: 'nonexistent@example.com',
          password: 'SomePassword123!',
        },
      });

      const response = await POST(request);
      const data = await response.json();
      const { message, statusCode } = Errors.INVALID_CREDENTIALS;

      expect(response.status).toBe(statusCode);
      expect(data.error).toBe(message);
    });

    test('should fail login with non-existent username', async () => {
      const request = createMockRequest({
        credentials: {
          identifier: 'wronguser',
          password: 'SomePassword123!',
        },
      });

      const response = await POST(request);
      const data = await response.json();
      const { message, statusCode } = Errors.INVALID_CREDENTIALS;

      expect(response.status).toBe(statusCode);
      expect(data.error).toBe(message);
    });
  });

  describe('Input Validation', () => {
    test('should fail with empty identifier', async () => {
      const request = createMockRequest({
        credentials: {
          identifier: '',
          password: 'SomePassword123!',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid Input');
      expect(data.issues).toBeDefined();
    });

    test('should fail with empty password', async () => {
      const request = createMockRequest({
        credentials: {
          identifier: testUser.email,
          password: '',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid Input');
    });

    test('should fail with missing credentials', async () => {
      const request = createMockRequest({
        credentials: {
          identifier: testUser.email,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid Input');
    });

    if (process.env.NODE_ENV === 'production') {
      test('should fail with invalid email format in production', async () => {
        const request = createMockRequest({
          credentials: {
            identifier: 'invalid-email',
            password: 'SomePassword123!',
          },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid Input');
      });

      test('should fail with username less than 3 characters in production', async () => {
        const request = createMockRequest({
          credentials: {
            identifier: 'ab',
            password: 'SomePassword123!',
          },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid Input');
      });
    }
  });

  describe('Rate Limiting', () => {
    test('should block login after 5 failed attempts', async () => {
      const identifier = 'ratelimit@example.com';

      try {
        // Create 5 failed attempts
        for (let i = 0; i < 5; i++) {
          const request = createMockRequest(
            {
              credentials: {
                identifier,
                password: 'WrongPassword123!',
              },
            },
            {
              'x-forwarded-for': '192.168.1.100',
            }
          );

          await POST(request);
        }

        // 6th attempt should be rate limited
        const request = createMockRequest(
          {
            credentials: {
              identifier,
              password: 'WrongPassword123!',
            },
          },
          {
            'x-forwarded-for': '192.168.1.100',
          }
        );

        const response = await POST(request);
        const data = await response.json();
        const { message, statusCode } = Errors.TOO_MANY_REQUESTS;

        expect(response.status).toBe(statusCode);
        expect(data.error).toContain(message);
      } finally {
        // Cleanup - ensure this runs even if test fails
        await db
          .deleteFrom('login_attempts')
          .where('identifier', '=', identifier)
          .execute();
      }
    });

    test('should track rate limiting by IP address', async () => {
      const ip = '192.168.1.200';
      const testIdentifiers = Array.from({ length: 5 }, (_, i) => `user${i}@example.com`);
      const additionalIdentifier = 'newuser@example.com';

      try {
        // Create 5 failed attempts from same IP with different identifiers
        for (let i = 0; i < 5; i++) {
          const request = createMockRequest(
            {
              credentials: {
                identifier: testIdentifiers[i],
                password: 'WrongPassword123!',
              },
            },
            {
              'x-forwarded-for': ip,
            }
          );

          await POST(request);
        }

        // 6th attempt from same IP should be rate limited
        const request = createMockRequest(
          {
            credentials: {
              identifier: additionalIdentifier,
              password: 'SomePassword123!',
            },
          },
          {
            'x-forwarded-for': ip,
          }
        );

        const response = await POST(request);
        const data = await response.json();
        const { message, statusCode } = Errors.TOO_MANY_REQUESTS;

        expect(response.status).toBe(statusCode);
        expect(data.error).toContain(message);
      } finally {
        // Cleanup - ensure this runs even if test fails
        await db
          .deleteFrom('login_attempts')
          .where('identifier', 'in', [...testIdentifiers, additionalIdentifier])
          .execute();
      }
    });
  });

  describe('Request Headers', () => {
    test('should extract IP from x-forwarded-for header', async () => {
      const customIp = '203.0.113.42';
      const request = createMockRequest(
        {
          credentials: {
            identifier: testUser.email,
            password: testUser.password,
          },
        },
        {
          'x-forwarded-for': customIp,
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(200);

      // Verify the IP was recorded
      const loginAttempt = await db
        .selectFrom('login_attempts')
        .selectAll()
        .where('identifier', '=', testUser.email)
        .where('successful', '=', true)
        .orderBy('attempt_at', 'desc')
        .executeTakeFirst();

      expect(loginAttempt?.ip_address).toBe(customIp);
    });

    test('should extract IP from cf-connecting-ip header (Cloudflare)', async () => {
      const cloudflareIp = '198.51.100.1';
      const request = createMockRequest(
        {
          credentials: {
            identifier: testUser.email,
            password: testUser.password,
          },
        },
        {
          'cf-connecting-ip': cloudflareIp,
          'x-forwarded-for': '10.0.0.1', // Should prefer cf-connecting-ip
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(200);

      const loginAttempt = await db
        .selectFrom('login_attempts')
        .selectAll()
        .where('identifier', '=', testUser.email)
        .where('successful', '=', true)
        .orderBy('attempt_at', 'desc')
        .executeTakeFirst();

      expect(loginAttempt?.ip_address).toBe(cloudflareIp);
    });

    test('should record user agent', async () => {
      const customUserAgent = 'CustomBrowser/1.0';
      const request = createMockRequest(
        {
          credentials: {
            identifier: testUser.email,
            password: testUser.password,
          },
        },
        {
          'user-agent': customUserAgent,
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(200);

      const loginAttempt = await db
        .selectFrom('login_attempts')
        .selectAll()
        .where('identifier', '=', testUser.email)
        .where('successful', '=', true)
        .orderBy('attempt_at', 'desc')
        .executeTakeFirst();

      expect(loginAttempt?.user_agent).toBe(customUserAgent);
    });
  });

  describe('Session Creation', () => {
    test('should create session cookie with correct attributes', async () => {
      const request = createMockRequest({
        credentials: {
          identifier: testUser.email,
          password: testUser.password,
        },
      });

      const response = await POST(request);
      const setCookieHeader = response.headers.get('set-cookie');

      expect(setCookieHeader).toContain('session_token=');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('SameSite');
      expect(setCookieHeader).toContain('Path=/');
    });

    test('should set Secure flag in production', async () => {
      if (process.env.NODE_ENV === 'production') {
        const request = createMockRequest({
          credentials: {
            identifier: testUser.email,
            password: testUser.password,
          },
        });

        const response = await POST(request);
        const setCookieHeader = response.headers.get('set-cookie');

        expect(setCookieHeader).toContain('Secure');
      }
    });
  });
});
