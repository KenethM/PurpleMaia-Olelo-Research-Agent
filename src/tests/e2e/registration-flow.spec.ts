import { test, expect } from '@playwright/test';
import { db } from '@/db/kysely/client';
import { randomInt } from 'crypto';

/**
 * E2E Registration Flow Tests
 *
 * Tests user registration with real interactions:
 * - Form filling
 * - Validation
 * - Database verification
 */

const timestamp = Date.now();
const randomSuffix = randomInt(1000, 9999);
const newUser = {
  email: `newuser-${randomSuffix}@example.com`,
  username: `newuser${randomSuffix}`,
  password: 'NewPassword123!',
};

test.describe.configure({ mode: 'serial' }); // Run tests in order since they depend on shared state (test user in DB)

test.describe('Registration Flow', () => {
  test.afterEach(async () => {
    // Cleanup any user created during tests
    await db.deleteFrom('sessions')
      .where('user_id', 'in',
        db.selectFrom('users')
          .select('id')
          .where('email', '=', newUser.email)
      )
      .execute();

    await db.deleteFrom('users')
      .where('email', '=', newUser.email)
      .execute();
  })

  test.afterAll(async () => {
    await db.deleteFrom('sessions')
      .where('user_id', 'in',
        db.selectFrom('users')
          .select('id')
          .where('email', '=', newUser.email)
      )
      .execute();

    await db.deleteFrom('users')
      .where('email', '=', newUser.email)
      .execute();

    await db.deleteFrom('orgs')
      .where('name', 'like', `TestOrg%${randomSuffix}`)
      .execute();

    await db.destroy();
  });

  test('should successfully register a new user with no organization', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    await page.waitForLoadState('networkidle');

    // Verify we're on the registration page
    await expect(page).toHaveURL(/.*register/);
    await page.waitForSelector('[id="register-form"]', { state: 'visible' });

    // Fill in registration form
    await page.fill('input#email', newUser.email);
    await page.fill('input#username', newUser.username);
    await page.fill('input#password', newUser.password);
    await page.fill('input#confirmPassword', newUser.password);

    // Click register button
    await page.click('button[type="submit"]');

    // Wait for successful registration (redirect away from register page)
    await page.waitForURL(/^(?!.*register).*$/, { timeout: 10000 });

    // Verify we're redirected (to dashboard or home)
    expect(page.url()).not.toContain('/register');

    // Verify user was created in database
    const createdUser = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', newUser.email)
      .executeTakeFirst();

    expect(createdUser).toBeDefined();
    expect(createdUser?.username).toBe(newUser.username);
    expect(createdUser?.email).toBe(newUser.email);

    // Verify session was created
    const session = await db
      .selectFrom('sessions')
      .selectAll()
      .where('user_id', '=', createdUser!.id)
      .executeTakeFirst();

    expect(session).toBeDefined();
  });

  test('should successfully register a new user with organization', async ({ page }) => {
    // First create an organization in the database
    const orgName = `TestOrg${randomSuffix}`;
    const orgResult = await db
      .insertInto('orgs')
      .values({
        name: orgName,
        slug: `testorg-${randomSuffix}`
      })
      .returning(['id'])
      .executeTakeFirst();

    const orgId = orgResult?.id;
    expect(orgId).toBeDefined();

    // Navigate to registration page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Verify we're on the registration page
    await expect(page).toHaveURL(/.*register/);
    await page.waitForSelector('[id="register-form"]', { state: 'visible' });

    // Fill in registration form
    await page.fill('input#email', newUser.email);
    await page.fill('input#username', newUser.username);
    await page.fill('input#password', newUser.password);
    await page.fill('input#confirmPassword', newUser.password);

    // Click checkbox to join organization (using playwright's getByLabel to find the checkbox by its label text)
    await page.getByLabel('Are you part of an organization?').check();

    // Wait for Shadcn Select component to appear
    await page.waitForSelector('[id="org-selector"]', { state: 'visible' });

    // Click the SelectTrigger to open dropdown (Shadcn Select uses button with id="organization")
    await page.click('button#organization');

    // Wait for dropdown options to be visible (Shadcn renders options with role="option")
    await page.waitForSelector('[role="option"]', { state: 'visible' });

    // Click the option matching the organization name
    await page.click(`[role="option"]:has-text("${orgName}")`);

    // Click register button
    await page.click('button[type="submit"]');

    // Wait for successful registration (redirect away from register page)
    await page.waitForURL(/^(?!.*register).*$/, { timeout: 10000 });

    // Verify we're redirected (to dashboard or home)
    expect(page.url()).not.toContain('/register');

    // Verify user was created in database with organization membership
    const createdUser = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', newUser.email)
      .executeTakeFirst();

    expect(createdUser).toBeDefined();
    expect(createdUser?.username).toBe(newUser.username);
    expect(createdUser?.email).toBe(newUser.email);

    const membership = await db
      .selectFrom('members')
      .selectAll()
      .where('user_id', '=', createdUser!.id)
      .where('org_id', '=', orgId!)
      .executeTakeFirst();

    expect(membership).toBeDefined();

  });

  test('should show error when email already exists', async ({ page }) => {
    // First create a user
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('[id="register-form"]', { state: 'visible' });
    await page.fill('input#email', `duplicate-${timestamp}@example.com`);
    await page.fill('input#username', `duplicate${timestamp}`);
    await page.fill('input#password', 'Password123!');
    await page.fill('input#confirmPassword', 'Password123!');
    
    await page.click('button[type="submit"]');
    await page.waitForURL(/^(?!.*register).*$/, { timeout: 10000 });

    // Try to register again with same email
    await page.goto('/register');    
    await page.fill('input#email', `duplicate-${timestamp}@example.com`);
    await page.fill('input#username', `different${timestamp}`);
    await page.fill('input#password', 'Password123!');
    await page.fill('input#confirmPassword', 'Password123!');

    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForSelector('text=/email.*taken|already.*exists/i', { timeout: 5000 });

    // Verify error is shown
    const errorMessage = page.locator('text=/email.*taken|already.*exists/i');
    await expect(errorMessage).toBeVisible();

    // Cleanup
    await db.deleteFrom('sessions')
      .where('user_id', 'in',
        db.selectFrom('users')
          .select('id')
          .where('email', '=', `duplicate-${timestamp}@example.com`)
      )
      .execute();
    await db.deleteFrom('users')
      .where('email', '=', `duplicate-${timestamp}@example.com`)
      .execute();
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[id="register-form"]', { state: 'visible' });

    // Fill form with weak password
    await page.fill('input#email', `test-${timestamp}@example.com`);
    await page.fill('input#username', `testuser${timestamp}`);
    await page.fill('input#password', '123'); // Too short
    await page.fill('input#confirmPassword', '123');

    await page.click('button[type="submit"]');

    // Verify validation error appears
    const validationError = page.locator('text=/password.*8.*characters|password.*too.*short/i');
    await expect(validationError.first()).toBeVisible({ timeout: 3000 });
  });

  test('should validate username requirements', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[id="register-form"]', { state: 'visible' });

    // Fill form with invalid username
    await page.fill('input#email', `test2-${timestamp}@example.com`);
    await page.fill('input#username', 'ab'); // Too short
    await page.fill('input#password', 'ValidPassword123!');
    await page.fill('input#confirmPassword', 'ValidPassword123!');

    await page.click('button[type="submit"]');

    // Verify validation error appears
    const validationError = page.locator('text=/username.*3.*characters|username.*too.*short/i');
    await expect(validationError.first()).toBeVisible({ timeout: 3000 });
  });
});
