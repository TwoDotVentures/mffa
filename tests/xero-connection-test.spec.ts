import { test, expect } from '@playwright/test';

test.describe('Xero Connection OAuth Flow Tests', () => {
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
      const screenshotPath = `/Users/g/dev/mffa/tests/screenshots/xero-${testInfo.title.replace(/\s+/g, '-')}-failure.png`;
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

  test('1. Navigate to Bank Connections page', async ({ page }) => {
    console.log('\n=== TEST: Navigate to Bank Connections Page ===\n');

    await page.goto('http://localhost:3000/settings/bank-connections', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Current URL:', page.url());

    // Check if we're redirected to login
    if (page.url().includes('/login')) {
      console.log('Redirected to login - authentication required');

      await page.screenshot({
        path: '/Users/g/dev/mffa/tests/screenshots/xero-01-login-page.png',
        fullPage: true
      });

      // Try to sign in with test credentials
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      if (await emailInput.isVisible()) {
        console.log('Attempting to log in...');
        const testEmail = 'test@example.com';
        const testPassword = 'TestPassword123!';

        await emailInput.fill(testEmail);
        await passwordInput.fill(testPassword);

        // Click sign in button
        await page.getByRole('button', { name: /sign in|log in/i }).click();
        await page.waitForTimeout(3000);

        console.log('After login attempt URL:', page.url());

        // Navigate again after login
        if (!page.url().includes('/settings/bank-connections')) {
          await page.goto('http://localhost:3000/settings/bank-connections', {
            waitUntil: 'networkidle',
            timeout: 30000
          });
        }
      }
    }

    await page.waitForTimeout(2000);

    await page.screenshot({
      path: '/Users/g/dev/mffa/tests/screenshots/xero-02-bank-connections-page.png',
      fullPage: true
    });

    // Verify we're on the bank connections page
    const pageTitle = await page.locator('h1, h2').first().textContent();
    console.log('Page title:', pageTitle);

    expect(pageTitle).toContain('Bank');
  });

  test('2. Verify page structure and Xero section exists', async ({ page }) => {
    console.log('\n=== TEST: Verify Page Structure ===\n');

    await page.goto('http://localhost:3000/settings/bank-connections', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      console.log('Authentication required - skipping this test');
      test.skip();
      return;
    }

    await page.screenshot({
      path: '/Users/g/dev/mffa/tests/screenshots/xero-03-page-structure.png',
      fullPage: true
    });

    // Check for Xero Integration section
    const xeroHeading = page.locator('text=Xero Integration');
    const hasXeroSection = await xeroHeading.isVisible().catch(() => false);
    console.log('Xero Integration section visible:', hasXeroSection);
    expect(hasXeroSection).toBe(true);

    // Check for info card
    const infoCard = page.locator('text=Transaction Import Options');
    const hasInfoCard = await infoCard.isVisible().catch(() => false);
    console.log('Info card visible:', hasInfoCard);

    // Check for CSV import section
    const csvSection = page.locator('text=CSV Import');
    const hasCsvSection = await csvSection.isVisible().catch(() => false);
    console.log('CSV Import section visible:', hasCsvSection);

    // Check page content
    const pageContent = await page.content();
    console.log('Page contains "Xero":', pageContent.includes('Xero'));
    console.log('Page contains "Connect":', pageContent.includes('Connect'));
  });

  test('3. Find and verify Connect to Xero button', async ({ page }) => {
    console.log('\n=== TEST: Find Connect to Xero Button ===\n');

    await page.goto('http://localhost:3000/settings/bank-connections', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      console.log('Authentication required - skipping this test');
      test.skip();
      return;
    }

    await page.screenshot({
      path: '/Users/g/dev/mffa/tests/screenshots/xero-04-connect-button-search.png',
      fullPage: true
    });

    // Look for Connect to Xero button - try multiple selectors
    let connectButton = page.getByRole('button', { name: /connect to xero/i });
    let hasConnectButton = await connectButton.isVisible().catch(() => false);

    console.log('Connect to Xero button visible:', hasConnectButton);

    if (!hasConnectButton) {
      // Try alternative button text
      connectButton = page.getByRole('button', { name: /add organization/i });
      hasConnectButton = await connectButton.isVisible().catch(() => false);
      console.log('Add Organization button visible:', hasConnectButton);
    }

    if (!hasConnectButton) {
      // List all buttons on the page for debugging
      const allButtons = await page.locator('button').allTextContents();
      console.log('All buttons on page:', allButtons);
    }

    // Check if already connected
    const xeroConnectionCard = page.locator('text=Xero Accounting');
    const hasConnectionInfo = await xeroConnectionCard.isVisible().catch(() => false);
    console.log('Xero Accounting text visible:', hasConnectionInfo);

    expect(hasConnectButton || hasConnectionInfo).toBe(true);
  });

  test('4. Click Connect to Xero and test OAuth flow initiation', async ({ page, context }) => {
    console.log('\n=== TEST: Click Connect to Xero Button ===\n');

    await page.goto('http://localhost:3000/settings/bank-connections', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      console.log('Authentication required - skipping this test');
      test.skip();
      return;
    }

    // Take initial screenshot
    await page.screenshot({
      path: '/Users/g/dev/mffa/tests/screenshots/xero-05-before-click.png',
      fullPage: true
    });

    // Find the Connect to Xero button
    let connectButton = page.getByRole('button', { name: /connect to xero/i });
    let hasConnectButton = await connectButton.isVisible().catch(() => false);

    if (!hasConnectButton) {
      connectButton = page.getByRole('button', { name: /add organization/i });
      hasConnectButton = await connectButton.isVisible().catch(() => false);
    }

    if (!hasConnectButton) {
      console.log('Connect button not found - may already be connected');
      test.skip();
      return;
    }

    console.log('Found Connect to Xero button, clicking...');

    // Set up promise to wait for navigation or popup
    const navigationPromise = page.waitForURL(/.*/, { timeout: 10000 }).catch(() => null);

    // Listen for new pages (popups)
    const popupPromise = context.waitForEvent('page', { timeout: 5000 }).catch(() => null);

    // Click the button
    await connectButton.click();
    console.log('Button clicked');

    // Wait a moment for loading state
    await page.waitForTimeout(1000);

    // Take screenshot after click
    await page.screenshot({
      path: '/Users/g/dev/mffa/tests/screenshots/xero-06-after-click.png',
      fullPage: true
    });

    // Check for loading state
    const loadingIndicator = page.locator('text=Connecting');
    const isLoading = await loadingIndicator.isVisible().catch(() => false);
    console.log('Loading indicator visible:', isLoading);

    // Wait for navigation or popup
    const [navigation, popup] = await Promise.all([navigationPromise, popupPromise]);

    console.log('Navigation occurred:', !!navigation);
    console.log('Popup opened:', !!popup);

    if (popup) {
      console.log('Popup URL:', popup.url());
      await popup.screenshot({
        path: '/Users/g/dev/mffa/tests/screenshots/xero-07-popup.png',
        fullPage: true
      });

      // Check if popup is Xero login page
      const popupUrl = popup.url();
      console.log('Popup redirected to Xero:', popupUrl.includes('xero.com') || popupUrl.includes('login.xero.com'));

      await popup.close();
    }

    // Wait for potential redirect
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('Current URL after click:', currentUrl);

    // Check if redirected to Xero OAuth
    if (currentUrl.includes('xero.com') || currentUrl.includes('login.xero.com')) {
      console.log('✅ Successfully redirected to Xero OAuth page');

      await page.screenshot({
        path: '/Users/g/dev/mffa/tests/screenshots/xero-08-xero-oauth-page.png',
        fullPage: true
      });

      // Log some details about the OAuth page
      const pageTitle = await page.title();
      console.log('OAuth page title:', pageTitle);

      // Check URL parameters
      const url = new URL(currentUrl);
      console.log('OAuth parameters present:');
      console.log('  - client_id:', url.searchParams.has('client_id'));
      console.log('  - redirect_uri:', url.searchParams.has('redirect_uri'));
      console.log('  - state:', url.searchParams.has('state'));
      console.log('  - scope:', url.searchParams.has('scope'));

    } else if (currentUrl.includes('/settings/bank-connections')) {
      // Check for error parameters
      const url = new URL(currentUrl);
      const error = url.searchParams.get('error');
      const success = url.searchParams.get('success');

      if (error) {
        console.log('❌ Error returned:', error);

        // Check if error alert is displayed
        const errorAlert = page.locator('[role="alert"]');
        const hasErrorAlert = await errorAlert.isVisible().catch(() => false);

        if (hasErrorAlert) {
          const errorText = await errorAlert.textContent();
          console.log('Error alert text:', errorText);
        }
      } else if (success) {
        console.log('✅ Success returned:', success);
      } else {
        console.log('⚠️ Stayed on same page without redirect or error');
      }
    } else {
      console.log('⚠️ Unexpected URL:', currentUrl);
    }

    // Final screenshot
    await page.screenshot({
      path: '/Users/g/dev/mffa/tests/screenshots/xero-09-final-state.png',
      fullPage: true
    });
  });

  test('5. Check for OAuth callback handling with error parameters', async ({ page }) => {
    console.log('\n=== TEST: OAuth Callback Error Handling ===\n');

    // Test various error scenarios
    const errorCases = [
      { code: 'oauth_denied', expected: 'Authorization was denied' },
      { code: 'missing_params', expected: 'Missing required parameters' },
      { code: 'invalid_state', expected: 'Invalid session state' },
      { code: 'unauthorized', expected: 'not authorized' },
      { code: 'no_organization', expected: 'No Xero organization' },
      { code: 'callback_failed', expected: 'Failed to complete' },
    ];

    for (const errorCase of errorCases) {
      console.log(`\nTesting error case: ${errorCase.code}`);

      await page.goto(`http://localhost:3000/settings/bank-connections?error=${errorCase.code}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      await page.waitForTimeout(1000);

      // Check for error alert
      const errorAlert = page.locator('[role="alert"]');
      const hasErrorAlert = await errorAlert.isVisible().catch(() => false);

      console.log(`Error alert visible for ${errorCase.code}:`, hasErrorAlert);

      if (hasErrorAlert) {
        const errorText = await errorAlert.textContent();
        console.log(`Error message:`, errorText);

        // Verify the error message contains expected text
        const containsExpected = errorText?.toLowerCase().includes(errorCase.expected.toLowerCase());
        console.log(`Contains expected text "${errorCase.expected}":`, containsExpected);
      }

      await page.screenshot({
        path: `/Users/g/dev/mffa/tests/screenshots/xero-error-${errorCase.code}.png`,
        fullPage: true
      });
    }
  });

  test('6. Check for success callback handling', async ({ page }) => {
    console.log('\n=== TEST: OAuth Success Callback ===\n');

    await page.goto('http://localhost:3000/settings/bank-connections?success=connected', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(1000);

    // Check for success alert
    const successAlert = page.locator('[role="alert"]').filter({ hasText: /connected/i });
    const hasSuccessAlert = await successAlert.isVisible().catch(() => false);

    console.log('Success alert visible:', hasSuccessAlert);

    if (hasSuccessAlert) {
      const successText = await successAlert.textContent();
      console.log('Success message:', successText);
    }

    await page.screenshot({
      path: '/Users/g/dev/mffa/tests/screenshots/xero-10-success-state.png',
      fullPage: true
    });
  });

  test('7. Check for 404 errors on related endpoints', async ({ page }) => {
    console.log('\n=== TEST: Check for 404 Errors ===\n');

    const endpointsToCheck = [
      '/api/xero/authorize',
      '/callback',
      '/settings/bank-connections',
    ];

    for (const endpoint of endpointsToCheck) {
      console.log(`\nChecking endpoint: ${endpoint}`);

      const response = await page.goto(`http://localhost:3000${endpoint}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      const status = response?.status();
      console.log(`Status: ${status}`);

      if (status === 404) {
        console.log(`❌ 404 ERROR: ${endpoint} not found`);
        await page.screenshot({
          path: `/Users/g/dev/mffa/tests/screenshots/xero-404-${endpoint.replace(/\//g, '-')}.png`,
          fullPage: true
        });
      } else {
        console.log(`✅ ${endpoint} exists (status: ${status})`);
      }
    }
  });

  test('8. Test complete OAuth flow simulation', async ({ page }) => {
    console.log('\n=== TEST: Complete OAuth Flow Simulation ===\n');

    // This test simulates the complete flow
    console.log('Step 1: Navigate to bank connections');
    await page.goto('http://localhost:3000/settings/bank-connections', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    if (page.url().includes('/login')) {
      console.log('Authentication required - skipping this test');
      test.skip();
      return;
    }

    await page.waitForTimeout(2000);

    console.log('Step 2: Look for existing connections or connect button');

    // Check if there are existing connections
    const connectionCards = page.locator('[class*="rounded-lg"]').filter({ hasText: /xero/i });
    const connectionCount = await connectionCards.count();
    console.log('Existing Xero connections:', connectionCount);

    if (connectionCount > 0) {
      console.log('Found existing Xero connection(s)');

      // Take screenshot of connections
      await page.screenshot({
        path: '/Users/g/dev/mffa/tests/screenshots/xero-11-existing-connections.png',
        fullPage: true
      });

      // Look for account mappings or sync status
      const syncButton = page.getByRole('button', { name: /sync/i });
      const hasSyncButton = await syncButton.isVisible().catch(() => false);
      console.log('Sync button visible:', hasSyncButton);

      const disconnectButton = page.getByRole('button', { name: /disconnect/i });
      const hasDisconnectButton = await disconnectButton.isVisible().catch(() => false);
      console.log('Disconnect button visible:', hasDisconnectButton);

    } else {
      console.log('No existing connections found');

      // Try to initiate connection
      const connectButton = page.getByRole('button', { name: /connect to xero/i });
      const hasConnectButton = await connectButton.isVisible().catch(() => false);

      if (hasConnectButton) {
        console.log('Connect button found - OAuth flow can be initiated');
      } else {
        console.log('⚠️ No connect button found');
      }
    }

    await page.screenshot({
      path: '/Users/g/dev/mffa/tests/screenshots/xero-12-final-flow-state.png',
      fullPage: true
    });

    console.log('\n✅ OAuth flow test completed');
  });
});
