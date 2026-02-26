// Mock arctic module for Oauth interactions
jest.mock('arctic', () => ({
  Google: jest.fn().mockImplementation(() => ({
    createAuthorizationURL: jest.fn(),
    validateAuthorizationCode: jest.fn(),
  })),
  generateState: jest.fn(() => 'mock-state'),
  generateCodeVerifier: jest.fn(() => 'mock-code-verifier'),
}));

import { GET } from '@/app/api/auth/google/callback/route';
import { db } from '@/db/kysely/client';
import { hashPassword } from '@/lib/auth/password';
import { randomUUID } from 'crypto';
import { createMockGetRequest } from './helpers';

/*
1. Test successful OAuth registration:
   - Simulate OAuth provider response with user data
   - Expect 201 response with user data and session cookie

2. Test existing user login:
   - Simulate OAuth provider response with existing user email
   - Expect 200 response with user data and session cookie

3. Test new user registration:
   - Simulate OAuth provider response with new user email
   - Expect 201 response with user data and session cookie

4. Test OAuth provider error:
   - Simulate OAuth provider error response
   - Expect 401 response with error message

5. Test session creation:
   - Simulate successful OAuth login
   - Expect session to be created in database

6. Test user data retrieval:
   - Simulate authenticated request
   - Expect user data to be returned

*/

// Mock Google user data
const mockGoogleUser = {
   sub: 'google-user-id-' + randomUUID(),
   email: 'oauth-test@gmail.com',
   email_verified: true,
   name: 'OAuth Test User',
   given_name: 'OAuth',
   family_name: 'Test User',
   picture: 'https://example.com/photo.jpg',
};

const mockGoogleUser2 = {
   sub: 'google-user-id-2-' + randomUUID(),
   email: 'oauth-test-2@gmail.com',
   email_verified: true,
   name: 'OAuth Test User 2',
   given_name: 'OAuth2',
   family_name: 'Test User 2',
};

// Existing user for account linking tests
const existingUserForOAuth = {
   id: randomUUID(),
   email: 'existing-oauth-user@gmail.com',
   username: 'existingoauthuser',
   password: 'ExistingPassword123!',
   system_role: 'user' as const,
};

// Existing OAuth account for login tests
const existingOAuthUser = {
   id: randomUUID(),
   email: 'linked-oauth-user@gmail.com',
   username: 'linkedoauthuser',
   password_hash: '',
   system_role: 'user' as const,
   googleSub: 'existing-google-sub-' + randomUUID(),
};

// State and code verifier for tests
const validState = 'valid-oauth-state-' + randomUUID();
const validCodeVerifier = 'valid-code-verifier-' + randomUUID();

// Mock cookies storage
let mockCookieStore: Record<string, string> = {};

// Mock validateGoogleAuthorizationCode
jest.mock('@/lib/auth/oauth', () => ({
   ...jest.requireActual('@/lib/auth/oauth'),
   validateGoogleAuthorizationCode: jest.fn(),
}));

// Mock next/headers cookies
jest.mock('next/headers', () => ({
   cookies: jest.fn(() => ({
      get: (name: string) => {
         const value = mockCookieStore[name];
         return value ? { value, name } : undefined;
      },
      set: (name: string, value: string) => {
         mockCookieStore[name] = value;
      },
      delete: (name: string) => {
         delete mockCookieStore[name];
      },
   })),
}));

// Base URL for OAuth callback
const OAUTH_CALLBACK_URL = 'http://localhost:3000/api/auth/google/callback';

describe('OAuth Tests', () => {
   // Setup: Create existing users and OAuth accounts before tests
   beforeAll(async () => {
      // Create existing user (for account linking test)
      const passwordHash = await hashPassword(existingUserForOAuth.password);
      await db.insertInto('users').values({
         id: existingUserForOAuth.id,
         email: existingUserForOAuth.email,
         username: existingUserForOAuth.username,
         password_hash: passwordHash,
         system_role: existingUserForOAuth.system_role,
         created_at: new Date(),
      }).execute();

      // Create existing OAuth user (for login test)
      await db.insertInto('users').values({
         id: existingOAuthUser.id,
         email: existingOAuthUser.email,
         username: existingOAuthUser.username,
         password_hash: existingOAuthUser.password_hash,
         system_role: existingOAuthUser.system_role,
         created_at: new Date(),
      }).execute();

      // Create existing OAuth account link
      await db.insertInto('oauth_accounts').values({
         user_id: existingOAuthUser.id,
         provider: 'google',
         provider_user_id: existingOAuthUser.googleSub,
         email: existingOAuthUser.email,
      }).execute();
   });

   // Reset mock cookies before each test
   beforeEach(() => {
      mockCookieStore = {
         'google_oauth_state': validState,
         'google_oauth_code_verifier': validCodeVerifier,
      };
      jest.clearAllMocks();
   });

   // Teardown: Clean up database after all tests
   afterAll(async () => {
      // Clean up sessions
      await db.deleteFrom('sessions').execute();
      
      // Clean up OAuth accounts
      await db.deleteFrom('oauth_accounts').where('user_id', '=', existingOAuthUser.id).execute();
      await db.deleteFrom('oauth_accounts').where('user_id', '=', existingUserForOAuth.id).execute();
      await db.deleteFrom('oauth_accounts').where('email', '=', mockGoogleUser.email).execute();
      await db.deleteFrom('oauth_accounts').where('email', '=', mockGoogleUser2.email).execute();
      
      // Clean up users
      await db.deleteFrom('users').where('id', '=', existingUserForOAuth.id).execute();
      await db.deleteFrom('users').where('id', '=', existingOAuthUser.id).execute();
      await db.deleteFrom('users').where('email', '=', mockGoogleUser.email).execute();
      await db.deleteFrom('users').where('email', '=', mockGoogleUser2.email).execute();

      await db.destroy();
   });

   describe('OAuth Callback - Missing Parameters', () => {
      test('should redirect to login with error when code is missing', async () => {
         const request = createMockGetRequest(OAUTH_CALLBACK_URL, { state: validState });

         const response = await GET(request);

         expect(response.status).toBe(307); // Redirect
         expect(response.headers.get('location')).toContain('/login');
         expect(response.headers.get('location')).toContain('error=missing_parameters');
      });

      test('should redirect to login with error when state is missing', async () => {
         const request = createMockGetRequest(OAUTH_CALLBACK_URL, { code: 'some-auth-code' });

         const response = await GET(request);

         expect(response.status).toBe(307); // Redirect
         expect(response.headers.get('location')).toContain('/login');
         expect(response.headers.get('location')).toContain('error=missing_parameters');
      });
   });

   describe('OAuth Callback - State Validation (CSRF Protection)', () => {
      test('should redirect to login when state does not match stored state', async () => {
         const request = createMockGetRequest(OAUTH_CALLBACK_URL, {
            code: 'some-auth-code',
            state: 'wrong-state-value',
         });

         const response = await GET(request);

         expect(response.status).toBe(307); // Redirect
         expect(response.headers.get('location')).toContain('/login');
         expect(response.headers.get('location')).toContain('error=invalid_state');
      });

      test('should redirect to login when stored state cookie is missing', async () => {
         // Remove the state cookie
         delete mockCookieStore['google_oauth_state'];

         const request = createMockGetRequest(OAUTH_CALLBACK_URL, {
            code: 'some-auth-code',
            state: validState,
         });

         const response = await GET(request);

         expect(response.status).toBe(307); // Redirect
         expect(response.headers.get('location')).toContain('/login');
         expect(response.headers.get('location')).toContain('error=invalid_state');
      });

      test('should redirect to login when code verifier cookie is missing', async () => {
         // Remove the code verifier cookie
         delete mockCookieStore['google_oauth_code_verifier'];

         const request = createMockGetRequest(OAUTH_CALLBACK_URL, {
            code: 'some-auth-code',
            state: validState,
         });

         const response = await GET(request);

         expect(response.status).toBe(307); // Redirect
         expect(response.headers.get('location')).toContain('/login');
         expect(response.headers.get('location')).toContain('error=missing_code_verifier');
      });
   });

   describe('OAuth Callback - Existing OAuth Account Login', () => {
      test('should login existing user with linked OAuth account', async () => {
         // Mock validateGoogleAuthorizationCode to return existing OAuth user
         const { validateGoogleAuthorizationCode } = require('@/lib/auth/oauth');
         validateGoogleAuthorizationCode.mockResolvedValue({
            sub: existingOAuthUser.googleSub,
            email: existingOAuthUser.email,
            email_verified: true,
            name: 'Linked OAuth User',
         });

         const request = createMockGetRequest(OAUTH_CALLBACK_URL, {
            code: 'valid-auth-code',
            state: validState,
         });

         const response = await GET(request);

         // Should redirect to dashboard (home)
         expect(response.status).toBe(307);
         expect(response.headers.get('location')).not.toContain('error');

         // Verify session was created
         const session = await db
            .selectFrom('sessions')
            .selectAll()
            .where('user_id', '=', existingOAuthUser.id)
            .executeTakeFirst();
         expect(session).toBeDefined();

         // Cleanup session
         await db.deleteFrom('sessions').where('user_id', '=', existingOAuthUser.id).execute();
      });
   });

   describe('OAuth Callback - Account Linking', () => {
      test('should link OAuth account to existing user with same email', async () => {
         // Mock validateGoogleAuthorizationCode to return a Google user with existing user's email
         const { validateGoogleAuthorizationCode } = require('@/lib/auth/oauth');
         const newGoogleSub = 'new-google-sub-' + randomUUID();
         validateGoogleAuthorizationCode.mockResolvedValue({
            sub: newGoogleSub,
            email: existingUserForOAuth.email,
            email_verified: true,
            name: 'Existing User',
         });

         const request = createMockGetRequest(OAUTH_CALLBACK_URL, {
            code: 'valid-auth-code',
            state: validState,
         });

         const response = await GET(request);

         // Should redirect to dashboard
         expect(response.status).toBe(307);
         expect(response.headers.get('location')).not.toContain('error');

         // Verify OAuth account was linked
         const oauthAccount = await db
            .selectFrom('oauth_accounts')
            .selectAll()
            .where('user_id', '=', existingUserForOAuth.id)
            .where('provider', '=', 'google')
            .executeTakeFirst();
         expect(oauthAccount).toBeDefined();
         expect(oauthAccount?.provider_user_id).toBe(newGoogleSub);

         // Verify session was created
         const session = await db
            .selectFrom('sessions')
            .selectAll()
            .where('user_id', '=', existingUserForOAuth.id)
            .executeTakeFirst();
         expect(session).toBeDefined();

         // Cleanup
         await db.deleteFrom('sessions').where('user_id', '=', existingUserForOAuth.id).execute();
         await db.deleteFrom('oauth_accounts').where('user_id', '=', existingUserForOAuth.id).execute();
      });
   });

   describe('OAuth Callback - New User Registration', () => {
      test('should create new user and OAuth account for new Google user', async () => {
         // Mock validateGoogleAuthorizationCode to return new user
         const { validateGoogleAuthorizationCode } = require('@/lib/auth/oauth');
         validateGoogleAuthorizationCode.mockResolvedValue(mockGoogleUser);

         const request = createMockGetRequest(OAUTH_CALLBACK_URL, {
            code: 'valid-auth-code',
            state: validState,
         });

         const response = await GET(request);

         // Should redirect to dashboard
         expect(response.status).toBe(307);
         expect(response.headers.get('location')).not.toContain('error');

         // Verify user was created
         const newUser = await db
            .selectFrom('users')
            .selectAll()
            .where('email', '=', mockGoogleUser.email)
            .executeTakeFirst();
         expect(newUser).toBeDefined();
         expect(newUser?.email).toBe(mockGoogleUser.email);
         expect(newUser?.password_hash).toBe(''); // OAuth users have no password
         expect(newUser?.system_role).toBe('user');

         // Verify OAuth account was created
         const oauthAccount = await db
            .selectFrom('oauth_accounts')
            .selectAll()
            .where('provider_user_id', '=', mockGoogleUser.sub)
            .executeTakeFirst();
         expect(oauthAccount).toBeDefined();
         expect(oauthAccount?.provider).toBe('google');
         expect(oauthAccount?.email).toBe(mockGoogleUser.email);

         // Verify session was created
         const session = await db
            .selectFrom('sessions')
            .selectAll()
            .where('user_id', '=', newUser!.id)
            .executeTakeFirst();
         expect(session).toBeDefined();

         // Cleanup
         await db.deleteFrom('sessions').where('user_id', '=', newUser!.id).execute();
      });

      test('should generate unique username when email prefix is taken', async () => {
         // First, create a user with username matching email prefix
         const emailPrefix = mockGoogleUser2.email.split('@')[0]; // oauth-test-2
         const existingUsernameUser = {
            id: randomUUID(),
            email: 'different-email@example.com',
            username: emailPrefix,
         };
         
         const passwordHash = await hashPassword('SomePassword123!');
         await db.insertInto('users').values({
            id: existingUsernameUser.id,
            email: existingUsernameUser.email,
            username: existingUsernameUser.username,
            password_hash: passwordHash,
            system_role: 'user',
            created_at: new Date(),
         }).execute();

         // Mock validateGoogleAuthorizationCode
         const { validateGoogleAuthorizationCode } = require('@/lib/auth/oauth');
         validateGoogleAuthorizationCode.mockResolvedValue(mockGoogleUser2);

         const request = createMockGetRequest(OAUTH_CALLBACK_URL, {
            code: 'valid-auth-code',
            state: validState,
         });

         const response = await GET(request);

         // Should redirect to dashboard
         expect(response.status).toBe(307);

         // Verify new user was created with modified username
         const newUser = await db
            .selectFrom('users')
            .selectAll()
            .where('email', '=', mockGoogleUser2.email)
            .executeTakeFirst();
         expect(newUser).toBeDefined();
         expect(newUser?.username).not.toBe(emailPrefix);
         expect(newUser?.username).toMatch(new RegExp(`^${emailPrefix}_\\d{4}$`)); // Should have 4 digit suffix

         // Cleanup
         await db.deleteFrom('sessions').where('user_id', '=', newUser!.id).execute();
         await db.deleteFrom('oauth_accounts').where('user_id', '=', newUser!.id).execute();
         await db.deleteFrom('users').where('id', '=', newUser!.id).execute();
         await db.deleteFrom('users').where('id', '=', existingUsernameUser.id).execute();
      });
   });

   describe('OAuth Callback - Provider Error', () => {
      test('should redirect to login when Google API fails', async () => {
         // Mock validateGoogleAuthorizationCode to throw error
         const { validateGoogleAuthorizationCode } = require('@/lib/auth/oauth');
         validateGoogleAuthorizationCode.mockRejectedValue(new Error('Failed to fetch user information from Google'));

         const request = createMockGetRequest(OAUTH_CALLBACK_URL, {
            code: 'invalid-auth-code',
            state: validState,
         });

         const response = await GET(request);

         expect(response.status).toBe(307); // Redirect
         expect(response.headers.get('location')).toContain('/login');
         expect(response.headers.get('location')).toContain('error=oauth_failed');
      });

      test('should redirect to login when token exchange fails', async () => {
         // Mock validateGoogleAuthorizationCode to throw token error
         const { validateGoogleAuthorizationCode } = require('@/lib/auth/oauth');
         validateGoogleAuthorizationCode.mockRejectedValue(new Error('Invalid authorization code'));

         const request = createMockGetRequest(OAUTH_CALLBACK_URL, {
            code: 'expired-auth-code',
            state: validState,
         });

         const response = await GET(request);

         expect(response.status).toBe(307); // Redirect
         expect(response.headers.get('location')).toContain('/login');
         expect(response.headers.get('location')).toContain('error=oauth_failed');
      });
   });

   describe('OAuth Session Creation', () => {
      test('should create valid session with correct expiration', async () => {
         // Mock validateGoogleAuthorizationCode
         const { validateGoogleAuthorizationCode } = require('@/lib/auth/oauth');
         const uniqueGoogleUser = {
            sub: 'session-test-google-sub-' + randomUUID(),
            email: 'session-test-' + randomUUID() + '@gmail.com',
            email_verified: true,
            name: 'Session Test User',
         };
         validateGoogleAuthorizationCode.mockResolvedValue(uniqueGoogleUser);

         const request = createMockGetRequest(OAUTH_CALLBACK_URL, {
            code: 'valid-auth-code',
            state: validState,
         });

         const beforeRequest = new Date();
         const response = await GET(request);
         const afterRequest = new Date();

         expect(response.status).toBe(307);

         // Find the newly created user
         const newUser = await db
            .selectFrom('users')
            .selectAll()
            .where('email', '=', uniqueGoogleUser.email)
            .executeTakeFirst();
         expect(newUser).toBeDefined();

         // Verify session was created with valid expiration
         const session = await db
            .selectFrom('sessions')
            .selectAll()
            .where('user_id', '=', newUser!.id)
            .executeTakeFirst();
         expect(session).toBeDefined();
         expect(session?.token_hash).toBeDefined();
         
         // Session should expire in ~24 hours
         const expectedMinExpiration = new Date(beforeRequest.getTime() + 23 * 60 * 60 * 1000); // 23 hours
         const expectedMaxExpiration = new Date(afterRequest.getTime() + 25 * 60 * 60 * 1000); // 25 hours
         expect(new Date(session!.expires_at).getTime()).toBeGreaterThan(expectedMinExpiration.getTime());
         expect(new Date(session!.expires_at).getTime()).toBeLessThan(expectedMaxExpiration.getTime());

         // Cleanup
         await db.deleteFrom('sessions').where('user_id', '=', newUser!.id).execute();
         await db.deleteFrom('oauth_accounts').where('user_id', '=', newUser!.id).execute();
         await db.deleteFrom('users').where('id', '=', newUser!.id).execute();
      });
   });
});