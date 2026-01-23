import { test, expect } from '@playwright/test';

test.describe('Xero Connection Manual Test', () => {
  test('Navigate and click Connect to Xero button', async ({ page }) => {
    // Capture all console messages
    page.on('console', (msg) => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
    });

    // Capture network requests
    page.on('request', (request) => {
      if (request.url().includes('xero') || request.url().includes('auth')) {
        console.log(`[REQUEST]: ${request.method()} ${request.url()}`);
      }
    });

    // Capture network responses
    page.on('response', (response) => {
      if (response.url().includes('xero') || response.url().includes('auth')) {
        console.log(`[RESPONSE]: ${response.status()} ${response.url()}`);
      }
    });

    console.log('\n=== STEP 1: Navigate to Bank Connections ===');
    await page.goto('https://finances.moyle.app/settings/bank-connections', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Current URL:', page.url());

    // Take screenshot of initial state
    await page.screenshot({
      path: '/Users/g/dev/mffa/tests/screenshots/manual-xero-01-initial.png',
      fullPage: true
    });

    console.log('\n=== STEP 2: Look for Connect to Xero button ===');

    // Find the button
    const connectButton = page.getByRole('button', { name: /connect to xero/i });
    const isVisible = await connectButton.isVisible({ timeout: 5000 }).catch(() => false);

    console.log('Connect button visible:', isVisible);

    if (!isVisible) {
      console.log('Button not found - listing all buttons:');
      const allButtons = await page.locator('button').allTextContents();
      console.log(allButtons);
      return;
    }

    console.log('\n=== STEP 3: Click Connect to Xero button ===');

    // Wait for any navigation or URL change
    const navigationPromise = Promise.race([
      page.waitForURL(/.*xero.*/i, { timeout: 10000 }).then(() => 'navigation'),
      page.waitForTimeout(5000).then(() => 'timeout')
    ]);

    await connectButton.click();
    console.log('Button clicked!');

    // Wait a moment for loading state
    await page.waitForTimeout(1000);

    // Check for loading indicator
    const loadingText = await page.locator('text=Connecting').isVisible().catch(() => false);
    console.log('Loading indicator shown:', loadingText);

    // Take screenshot after click
    await page.screenshot({
      path: '/Users/g/dev/mffa/tests/screenshots/manual-xero-02-after-click.png',
      fullPage: true
    });

    // Wait for navigation or timeout
    const result = await navigationPromise;
    console.log('Navigation result:', result);

    // Wait for any async operations
    await page.waitForTimeout(3000);

    console.log('\n=== STEP 4: Check final state ===');
    console.log('Final URL:', page.url());

    // Check for error alerts
    const alerts = page.locator('[role="alert"]');
    const alertCount = await alerts.count();
    console.log('Number of alerts:', alertCount);

    if (alertCount > 0) {
      for (let i = 0; i < alertCount; i++) {
        const alertText = await alerts.nth(i).textContent();
        console.log(`Alert ${i + 1}:`, alertText);
      }
    }

    // Take final screenshot
    await page.screenshot({
      path: '/Users/g/dev/mffa/tests/screenshots/manual-xero-03-final.png',
      fullPage: true
    });

    // Check if we're on Xero's OAuth page
    if (page.url().includes('xero.com') || page.url().includes('login.xero.com')) {
      console.log('\n✅ SUCCESS: Redirected to Xero OAuth page!');
      const pageTitle = await page.title();
      console.log('Page title:', pageTitle);

      // Check OAuth parameters
      const url = new URL(page.url());
      console.log('\nOAuth Parameters:');
      console.log('  client_id:', url.searchParams.get('client_id'));
      console.log('  redirect_uri:', url.searchParams.get('redirect_uri'));
      console.log('  state:', url.searchParams.has('state'));
      console.log('  scope:', url.searchParams.get('scope'));
    } else if (page.url().includes('bank-connections')) {
      console.log('\n⚠️ STAYED ON SAME PAGE');

      // Check for error in URL
      const url = new URL(page.url());
      const error = url.searchParams.get('error');
      if (error) {
        console.log('Error parameter:', error);
      }
    } else {
      console.log('\n❓ UNEXPECTED URL:', page.url());
    }
  });
});
