# Test Suite Documentation

## 📁 Folder Structure

```
src/tests/
├── lib/                    # Integration Tests (Jest)
│   └── auth/              # Authentication integration tests
│       ├── Login.test.tsx
│       ├── Session.test.tsx
│       ├── Oauth.test.tsx
│       └── helpers.ts     # Shared test utilities
│
├── e2e/                   # End-to-End Tests (Playwright)
│   ├── auth-flow.spec.ts  # Authentication E2E flows
│   └── registration-flow.spec.ts
│
└── setup.tsx              # Jest global setup
```

---

## 🧪 Test Types

### **Integration Tests** (Jest)
- **Purpose**: Test API routes, database operations, and backend logic
- **Technology**: Jest + Node environment
- **Database**: Uses real Kysely database connection
- **Location**: `src/tests/lib/**/*.test.tsx`

### **E2E Tests** (Playwright)
- **Purpose**: Test full user flows with real browser interactions
- **Technology**: Playwright + Chromium/Firefox/WebKit
- **Server**: Auto-starts dev server on port 3000
- **Location**: `src/tests/e2e/**/*.spec.ts`

---

## 🚀 Running Tests

### Integration Tests (Jest)

```bash
# Run all Jest tests
pnpm test:jest

# Run specific test file
pnpm test:jest -- Login.test.tsx
```

### E2E Tests (Playwright)

```bash
# Install browsers (first time only)
pnpm playwright install

# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e auth-flow

# Single browser
pnpm test:e2e --project=chromium
```

---

## ✍️ Writing New Tests

### Creating Integration Tests (Jest)

**File**: `src/tests/lib/<feature>/<Name>.test.tsx`

```typescript
import { POST } from '@/app/api/<route>/route';
import { db } from '@/db/kysely/client';
import { createMockRequest } from './helpers';

describe('Feature Tests', () => {
  beforeAll(async () => {
    // Setup test data
  });

  afterAll(async () => {
    // Cleanup
    await db.destroy();
  });

  test('should do something', async () => {
    const request = createMockRequest({ data: 'value' });
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

**Key Points:**
- Import route handlers directly
- Use `db` from `@/db/kysely/client` for database operations
- Always cleanup data in `afterAll` and call `db.destroy()`
- Use `helpers.ts` for mock requests and shared test data

### Creating E2E Tests (Playwright)

**File**: `src/tests/e2e/<feature>-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { db } from '@/db/kysely/client';

test.describe('Feature Flow', () => {
  test.beforeAll(async () => {
    // Create test data in database
  });

  test.afterAll(async () => {
    // Cleanup database
    await db.destroy();
  });

  test('should complete user flow', async ({ page }) => {
    await page.goto('/page');
    await page.waitForLoadState('networkidle');

    await page.fill('input#field', 'value');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/success/);
  });
});
```

**Key Points:**
- Use `page.goto()` to navigate
- Wait for `networkidle` after navigation
- Use semantic selectors (IDs, roles, text)
- Verify real database state after user actions

---

## 🔧 Configuration

### Jest Config (`jest.config.ts`)
- **Environment**: Node.js
- **Transform**: Next.js preset handles TypeScript/JSX
- **Setup**: `src/tests/setup.tsx` runs before all tests
- **Coverage**: Collects from `src/**/*.{ts,tsx}`

### Playwright Config (`playwright.config.ts`)
- **Test Directory**: `src/tests/e2e`
- **Base URL**: `http://localhost:3000`
- **Web Server**: Auto-starts with `pnpm dev`
- **Browsers**: Chromium, Firefox, WebKit
- **Parallel**: Runs tests in parallel by default

---

## 💡 Tips & Troubleshooting

### Serial Execution (Playwright)
By default, Playwright runs tests in parallel. For debugging or tests that share state:

```typescript
test.describe.configure({ mode: 'serial' });
```

### Port Already in Use
If Playwright hangs or fails to start:

```bash
# Start dev server manually to see what's on port 3000
pnpm dev

# Kill the process
lsof -ti:3000 | xargs kill -9
```

### Debugging Failed Tests

**Jest:**
```bash
# Run with verbose output
pnpm test -- --verbose

# Run single test
pnpm test -- -t "test name pattern"
```

**Playwright:**
```bash
# See traces and screenshots
pnpm exec playwright show-report

# Debug specific test
pnpm exec playwright test --debug auth-flow
```

### Mocking External APIs

**Integration (Jest):**
```typescript
jest.mock('arctic', () => ({
  Google: jest.fn().mockImplementation(() => ({ ... })),
}));
```

**E2E (Playwright):**
```typescript
await page.route('https://api.example.com/**', async (route) => {
  await route.fulfill({ status: 200, body: '{"data": "mock"}' });
});
```

---

## 📊 Test Coverage

View coverage reports after running:

```bash
pnpm test -- --coverage
```

Coverage reports are generated in `/coverage` directory.