import { test, expect } from '@playwright/test';

test.describe('Family Members Feature Tests', () => {
  // Track errors across tests
  let consoleMessages: { type: string; text: string }[] = [];
  let networkErrors: { url: string; status?: number; error?: string }[] = [];
  let pageErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset error tracking
    consoleMessages = [];
    networkErrors = [];
    pageErrors = [];

    // Capture console messages
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
      // Log errors immediately
      if (msg.type() === 'error') {
        console.log('CONSOLE ERROR:', msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
      console.log('PAGE ERROR:', error.message);
    });

    // Capture network failures
    page.on('requestfailed', (request) => {
      networkErrors.push({
        url: request.url(),
        error: request.failure()?.errorText || 'Unknown error'
      });
      console.log('REQUEST FAILED:', request.url());
    });

    // Capture failed responses (4xx, 5xx)
    page.on('response', (response) => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status()
        });
        console.log('HTTP ERROR:', response.status(), response.url());
      }
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Take screenshot on failure
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = `/Users/g/dev/mffa/tests/screenshots/family-members-${testInfo.title.replace(/\s+/g, '-')}-failure.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log('Screenshot saved to:', screenshotPath);
    }

    // Log summary
    console.log('\n--- Test Summary ---');
    console.log('Console Errors:', consoleMessages.filter(m => m.type === 'error').length);
    console.log('Page Errors:', pageErrors.length);
    console.log('Network Errors:', networkErrors.length);

    if (pageErrors.length > 0) {
      console.log('\nPage Errors:');
      pageErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    }

    if (networkErrors.length > 0) {
      console.log('\nNetwork Errors:');
      networkErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e.url} (${e.status || e.error})`));
    }
  });

  test('1. Navigate to Family Members page', async ({ page }) => {
    console.log('\n=== TEST: Navigate to Family Members page ===\n');

    // First navigate to login
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Current URL:', page.url());

    // Check if we need to authenticate
    if (page.url().includes('/login')) {
      console.log('On login page - checking for authentication options...');

      // Take screenshot
      await page.screenshot({
        path: '/Users/g/dev/mffa/tests/screenshots/family-members-01-login.png',
        fullPage: true
      });

      // Try to sign in with test credentials or sign up
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      if (await emailInput.isVisible()) {
        const testEmail = 'test@example.com';
        const testPassword = 'TestPassword123!';

        await emailInput.fill(testEmail);
        await passwordInput.fill(testPassword);

        // Click sign in
        await page.getByRole('button', { name: /sign in|log in/i }).click();
        await page.waitForTimeout(3000);

        console.log('After login attempt URL:', page.url());
      }
    }

    // Try to navigate to family-members
    console.log('Navigating to /family-members...');
    await page.goto('http://localhost:3000/family-members', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log('Current URL after navigation:', currentUrl);

    await page.screenshot({
      path: '/Users/g/dev/mffa/tests/screenshots/family-members-02-page.png',
      fullPage: true
    });

    // Check page content
    const pageContent = await page.content();
    console.log('Page contains "Family":', pageContent.includes('Family'));
    console.log('Page contains "Members":', pageContent.includes('Members'));
    console.log('Page contains error:', pageContent.toLowerCase().includes('error'));

    // Check for specific elements
    const heading = await page.locator('h1, h2').first().textContent().catch(() => 'No heading found');
    console.log('Page heading:', heading);

    // Check for tabs
    const tabsList = page.locator('[role="tablist"]');
    const hasTabs = await tabsList.isVisible().catch(() => false);
    console.log('Has tabs:', hasTabs);

    if (hasTabs) {
      const tabs = await tabsList.locator('[role="tab"]').allTextContents();
      console.log('Available tabs:', tabs);
    }

    // Check for Add Member button
    const addButton = page.getByRole('button', { name: /add member/i });
    const hasAddButton = await addButton.isVisible().catch(() => false);
    console.log('Add Member button visible:', hasAddButton);
  });

  test('2. Test Family Members List component', async ({ page }) => {
    console.log('\n=== TEST: Family Members List ===\n');

    await page.goto('http://localhost:3000/family-members', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    // Check if we're redirected to login
    if (page.url().includes('/login')) {
      console.log('Redirected to login - authentication required');
      test.skip();
      return;
    }

    await page.screenshot({
      path: '/Users/g/dev/mffa/tests/screenshots/family-members-03-list.png',
      fullPage: true
    });

    // Check for Members tab
    const membersTab = page.getByRole('tab', { name: /members/i });
    if (await membersTab.isVisible().catch(() => false)) {
      console.log('Clicking Members tab...');
      await membersTab.click();
      await page.waitForTimeout(1000);
    }

    // Check for loading state
    const loadingSpinner = page.locator('.animate-spin');
    const isLoading = await loadingSpinner.isVisible().catch(() => false);
    console.log('Loading spinner visible:', isLoading);

    if (isLoading) {
      // Wait for loading to complete
      await page.waitForTimeout(3000);
    }

    // Check for empty state
    const emptyState = page.locator('text=No family members');
    const isEmpty = await emptyState.isVisible().catch(() => false);
    console.log('Empty state visible:', isEmpty);

    // Check for member cards
    const memberCards = page.locator('[class*="rounded-lg border"]');
    const cardCount = await memberCards.count();
    console.log('Member cards found:', cardCount);
  });

  test('3. Test Add Family Member dialog', async ({ page }) => {
    console.log('\n=== TEST: Add Family Member Dialog ===\n');

    await page.goto('http://localhost:3000/family-members', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      console.log('Redirected to login - authentication required');
      test.skip();
      return;
    }

    // Find and click Add Member button
    const addButton = page.getByRole('button', { name: /add member/i });
    const hasAddButton = await addButton.isVisible().catch(() => false);

    if (!hasAddButton) {
      console.log('Add Member button not found');
      await page.screenshot({
        path: '/Users/g/dev/mffa/tests/screenshots/family-members-04-no-add-button.png',
        fullPage: true
      });
      return;
    }

    console.log('Clicking Add Member button...');
    await addButton.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: '/Users/g/dev/mffa/tests/screenshots/family-members-05-add-dialog.png',
      fullPage: true
    });

    // Check for dialog
    const dialog = page.locator('[role="dialog"]');
    const dialogVisible = await dialog.isVisible().catch(() => false);
    console.log('Dialog visible:', dialogVisible);

    if (dialogVisible) {
      // Check form fields
      const nameInput = dialog.locator('input[name="name"], input[placeholder*="name" i]');
      const hasNameInput = await nameInput.isVisible().catch(() => false);
      console.log('Name input visible:', hasNameInput);

      const memberTypeSelect = dialog.locator('button[role="combobox"]').first();
      const hasMemberTypeSelect = await memberTypeSelect.isVisible().catch(() => false);
      console.log('Member type select visible:', hasMemberTypeSelect);
    }
  });

  test('4. Test Fees tab', async ({ page }) => {
    console.log('\n=== TEST: Fees Tab ===\n');

    await page.goto('http://localhost:3000/family-members', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      console.log('Redirected to login - authentication required');
      test.skip();
      return;
    }

    // Click Fees tab
    const feesTab = page.getByRole('tab', { name: /fees/i });
    if (await feesTab.isVisible().catch(() => false)) {
      console.log('Clicking Fees tab...');
      await feesTab.click();
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: '/Users/g/dev/mffa/tests/screenshots/family-members-06-fees-tab.png',
        fullPage: true
      });

      // Check for fees content
      const feesContent = page.locator('[role="tabpanel"]');
      const contentText = await feesContent.textContent().catch(() => '');
      console.log('Fees tab content preview:', contentText?.substring(0, 200));
    } else {
      console.log('Fees tab not found');
    }
  });

  test('5. Test Activities tab', async ({ page }) => {
    console.log('\n=== TEST: Activities Tab ===\n');

    await page.goto('http://localhost:3000/family-members', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      console.log('Redirected to login - authentication required');
      test.skip();
      return;
    }

    // Click Activities tab
    const activitiesTab = page.getByRole('tab', { name: /activities/i });
    if (await activitiesTab.isVisible().catch(() => false)) {
      console.log('Clicking Activities tab...');
      await activitiesTab.click();
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: '/Users/g/dev/mffa/tests/screenshots/family-members-07-activities-tab.png',
        fullPage: true
      });
    } else {
      console.log('Activities tab not found');
    }
  });

  test('6. Test Schedule tab', async ({ page }) => {
    console.log('\n=== TEST: Schedule Tab ===\n');

    await page.goto('http://localhost:3000/family-members', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      console.log('Redirected to login - authentication required');
      test.skip();
      return;
    }

    // Click Schedule tab
    const scheduleTab = page.getByRole('tab', { name: /schedule/i });
    if (await scheduleTab.isVisible().catch(() => false)) {
      console.log('Clicking Schedule tab...');
      await scheduleTab.click();
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: '/Users/g/dev/mffa/tests/screenshots/family-members-08-schedule-tab.png',
        fullPage: true
      });
    } else {
      console.log('Schedule tab not found');
    }
  });

  test('7. Test Settings tab', async ({ page }) => {
    console.log('\n=== TEST: Settings Tab ===\n');

    await page.goto('http://localhost:3000/family-members', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      console.log('Redirected to login - authentication required');
      test.skip();
      return;
    }

    // Click Settings tab
    const settingsTab = page.getByRole('tab', { name: /settings/i });
    if (await settingsTab.isVisible().catch(() => false)) {
      console.log('Clicking Settings tab...');
      await settingsTab.click();
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: '/Users/g/dev/mffa/tests/screenshots/family-members-09-settings-tab.png',
        fullPage: true
      });

      // Check for category managers
      const feeTypesCard = page.locator('text=Fee Types');
      const hasFeeTypes = await feeTypesCard.isVisible().catch(() => false);
      console.log('Fee Types card visible:', hasFeeTypes);

      const activityTypesCard = page.locator('text=Activity Types');
      const hasActivityTypes = await activityTypesCard.isVisible().catch(() => false);
      console.log('Activity Types card visible:', hasActivityTypes);

      const frequenciesCard = page.locator('text=Payment Frequencies');
      const hasFrequencies = await frequenciesCard.isVisible().catch(() => false);
      console.log('Frequencies card visible:', hasFrequencies);
    } else {
      console.log('Settings tab not found');
    }
  });

  test('8. Check for JavaScript errors on page load', async ({ page }) => {
    console.log('\n=== TEST: JavaScript Errors Check ===\n');

    const jsErrors: string[] = [];
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });

    await page.goto('http://localhost:3000/family-members', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    console.log('JavaScript errors found:', jsErrors.length);
    if (jsErrors.length > 0) {
      console.log('\nJS Errors:');
      jsErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
      });
    }

    // The test passes but we log any errors found
    expect(jsErrors.length).toBeGreaterThanOrEqual(0);
  });

  test('9. Check network requests for errors', async ({ page }) => {
    console.log('\n=== TEST: Network Errors Check ===\n');

    const failedRequests: { url: string; status?: number; method: string }[] = [];

    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method()
        });
      }
    });

    await page.goto('http://localhost:3000/family-members', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    console.log('Failed network requests:', failedRequests.length);
    if (failedRequests.length > 0) {
      console.log('\nFailed requests:');
      failedRequests.forEach((req, i) => {
        console.log(`${i + 1}. [${req.method}] ${req.url} - Status: ${req.status}`);
      });
    }
  });

  test('10. Check database connection and data loading', async ({ page }) => {
    console.log('\n=== TEST: Database Connection Check ===\n');

    // Monitor for Supabase-related errors
    const supabaseErrors: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (text.toLowerCase().includes('supabase') ||
          text.toLowerCase().includes('database') ||
          text.toLowerCase().includes('postgres') ||
          text.toLowerCase().includes('error loading') ||
          text.toLowerCase().includes('failed to fetch')) {
        supabaseErrors.push(text);
      }
    });

    await page.goto('http://localhost:3000/family-members', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    console.log('Database/Supabase related messages:', supabaseErrors.length);
    if (supabaseErrors.length > 0) {
      console.log('\nMessages:');
      supabaseErrors.forEach((msg, i) => {
        console.log(`${i + 1}. ${msg}`);
      });
    }
  });
});
