import { test, expect } from '@playwright/test';
import { db } from '@/db/kysely/client';
import { hashPassword } from '@/lib/auth/password';
import { randomInt, randomUUID } from 'crypto';
import { Errors } from '@/lib/errors';

/**
 * E2E Authentication Flow Tests
 *
 * These tests simulate real user interactions:
 * - Navigating to pages
 * - Filling out forms
 * - Clicking buttons
 * - Verifying real data in the database
*/

const randomSuffix = randomInt(1000, 9999);
const testUser = {
  id: randomUUID(),
  email: `testuser-${randomSuffix}@example.com`,
  username: `testuser${randomSuffix}`,
  password: 'TestPassword123!',
};

test.describe.configure({ mode: 'serial' }); // Run tests in order since they depend on shared state (test user in DB)

test.describe('Authentication Flow', () => {
  // Setup: Create test user before tests
  test.beforeAll(async () => {
    const passwordHash = await hashPassword(testUser.password);
    await db.insertInto('users').values({
      id: testUser.id,
      email: testUser.email,
      username: testUser.username,
      password_hash: passwordHash,
      system_role: 'user',
    }).execute();

  });

  // Cleanup: Remove test user after tests
  test.afterAll(async () => {
    await db.deleteFrom('sessions').where('user_id', '=', testUser.id).execute();
    await db.deleteFrom('login_attempts').where('identifier', '=', testUser.email).execute();
    await db.deleteFrom('users').where('id', '=', testUser.id).execute();
    await db.destroy();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Ensure no login attempts or sessions exist for this user before starting
    await db.deleteFrom('sessions').where('user_id', '=', testUser.id).execute();
    await db.deleteFrom('login_attempts').where('identifier', '=', testUser.email).execute();

    await page.goto('/login');

    // Wait for the page to fully load (React hydration + network requests)
    await page.waitForLoadState('networkidle');

    // Wait for LoginForm component and input fields to be visible
    await page.waitForSelector('[id="login-form"]', { state: 'visible' });
    await page.waitForSelector('input#identifier', { state: 'visible' });
    await page.waitForSelector('input#password', { state: 'visible' });
    await page.waitForSelector('button[type="submit"]', { state: 'visible' });

    await expect(page).toHaveURL(/.*login/);

    // Fill inputs using their IDs (from your LoginForm component)
    await page.fill('input#identifier', testUser.email);
    await page.fill('input#password', testUser.password);

    // Click the submit button
    await page.click('button[type="submit"]');

    // Wait for navigation after successful login
    await page.waitForURL(/^(?!.*login).*$/, { timeout: 10000 });

    // Verify we're redirected away from login (to dashboard)
    expect(page.url()).not.toContain('/login');

    // Verify session cookie was set
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'session_token');
    expect(sessionCookie).toBeDefined();

    const session = await db
      .selectFrom('sessions')
      .selectAll()
      .where('user_id', '=', testUser.id)
      .executeTakeFirst();
    expect(session).toBeDefined();
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[id="login-form"]', { state: 'visible' });

    await page.fill('input#identifier', testUser.email);
    await page.fill('input#password', 'WrongPassword!');
    await page.click('button[type="submit"]');

    // Wait for error message to appear
    const errorMessage = await page.waitForSelector('[id="login-errors"]', { state: 'visible' });
    expect(errorMessage).toBeDefined();
    expect(await errorMessage.textContent()).toContain(Errors.INVALID_CREDENTIALS.message);

    // Verify we're still on the login page
    expect(page.url()).toContain('/login');
  });

  test('should lock account after multiple failed login attempts', async ({ page }) => {
    // Clear any existing failed attempts for this user
    await db.deleteFrom('login_attempts').where('identifier', '=', testUser.email).execute();

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[id="login-form"]', { state: 'visible' });

    // Attempt to login with wrong password 5 times, then on the 6th attempt we should get locked out
    for (let i = 0; i < 6; i++) {
      await page.fill('input#identifier', testUser.email);
      await page.fill('input#password', 'WrongPassword!');
      await page.click('button[type="submit"]');
      await page.waitForSelector('[id="login-errors"]', { state: 'visible' });      
    }

    const lockoutMessage = await page.waitForSelector('[id="login-errors"]', { state: 'visible' });
    expect(lockoutMessage).toBeDefined();
    expect(await lockoutMessage.textContent()).toContain(Errors.TOO_MANY_REQUESTS.message);

    // Verify we're still on the login page
    expect(page.url()).toContain('/login'); 
  });

  // NOTE: Google Oauth flow tests are limited to verifying the redirect to the authorization endpoint and handling of callback parameters.
  // Full end-to-end testing of the entire OAuth flow (including interaction with Google's servers) would require a more complex setup, such as using a mock OAuth provider or stubbing
  // network requests, which is beyond the scope of basic E2E tests. For now we can verify that the correct redirects and error handling are in place for the OAuth flow.
  test('OAuth login button should redirect to Google authorization', async ({ page }) => {
    await page.goto('/login?type=user');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[id="login-form"]', { state: 'visible' });

    // Verify Google OAuth button is visible (only for user login)
    const googleButton = page.locator('button:has-text("Sign in with Google")');
    await expect(googleButton).toBeVisible();

    // Click the Google OAuth button
    await googleButton.click();

    // Wait for redirect to Google's OAuth page
    await page.waitForLoadState('networkidle');

    // Verify we're on Google's OAuth consent page    
    await expect(page.locator('text=Sign in with Google')).toBeVisible({ timeout: 10000 });

    // Verify the URL is Google's accounts domain
    expect(page.url()).toContain('accounts.google.com');
  });    

  test('OAuth callback should reject invalid state (CSRF protection)', async ({ page }) => {
    await page.goto('/login?type=user');
    await page.waitForLoadState('networkidle');

    // Set valid OAuth state cookie
    const validState = 'valid-state-' + Date.now();
    const mockCodeVerifier = 'test-code-verifier-' + Date.now();

    await page.context().addCookies([
      {
        name: 'google_oauth_state',
        value: validState,
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'google_oauth_code_verifier',
        value: mockCodeVerifier,
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Try to callback with DIFFERENT state (CSRF attack simulation)
    const attackerState = 'attacker-state-different';
    await page.goto(`/api/auth/google/callback?code=mock-code&state=${attackerState}`);

    // Should redirect to login with error
    await page.waitForURL(/.*login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
    expect(page.url()).toContain('error=invalid_state');
  });

  test('OAuth callback should reject missing state parameter', async ({ page }) => {
    // Navigate to callback without state parameter
    await page.goto('/api/auth/google/callback?code=mock-code');

    // Should redirect to login with error
    await page.waitForURL(/.*login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
    expect(page.url()).toContain('error=missing_parameters');
  });

  test('OAuth callback should reject missing code parameter', async ({ page }) => {
    const mockState = 'test-state-' + Date.now();

    // Navigate to callback without code parameter
    await page.goto(`/api/auth/google/callback?state=${mockState}`);

    // Should redirect to login with error
    await page.waitForURL(/.*login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
    expect(page.url()).toContain('error=missing_parameters');
  });

  test('OAuth callback should reject when state cookie is missing', async ({ page }) => {
    // Try callback without setting state cookie first
    await page.goto('/api/auth/google/callback?code=mock-code&state=some-state');

    // Should redirect to login with error
    await page.waitForURL(/.*login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
    expect(page.url()).toContain('error=invalid_state');
  });
});
