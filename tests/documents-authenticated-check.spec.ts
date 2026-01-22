import { test, expect } from '@playwright/test';

test.describe('Documents Page - Authenticated Check', () => {
  test('Navigate to documents page after authentication', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = [];
    const networkErrors: { url: string; status?: number; error?: string }[] = [];
    const pageErrors: string[] = [];

    // Capture console messages
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    // Capture network failures
    page.on('requestfailed', (request) => {
      networkErrors.push({
        url: request.url(),
        error: request.failure()?.errorText || 'Unknown error'
      });
    });

    // Capture failed responses (4xx, 5xx)
    page.on('response', (response) => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    console.log('\n=== ATTEMPTING TO ACCESS DOCUMENTS PAGE ===\n');

    // First, try to go directly to documents
    console.log('Step 1: Attempting direct navigation to /documents...');
    await page.goto('http://localhost:3000/documents', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log('Current URL after navigation:', currentUrl);

    // Take screenshot of current state
    await page.screenshot({
      path: '/Users/g/dev/mffa/tests/screenshots/documents-auth-check-1.png',
      fullPage: true
    });

    if (currentUrl.includes('/login')) {
      console.log('\n✓ Authentication protection is working - redirected to login');
      console.log('\nStep 2: Checking if we can authenticate...');

      // Check if there's a test user or sign up option
      const signUpLink = page.getByText('Sign up');
      const hasSignUp = await signUpLink.isVisible().catch(() => false);

      console.log('Sign up link visible:', hasSignUp);

      if (hasSignUp) {
        console.log('\nStep 3: Attempting to create a test account...');

        await signUpLink.click();
        await page.waitForURL(/\/signup/, { timeout: 5000 });

        // Fill in signup form
        const testEmail = `test-${Date.now()}@example.com`;
        const testPassword = 'TestPassword123!';

        console.log('Creating account with email:', testEmail);

        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);

        await page.screenshot({
          path: '/Users/g/dev/mffa/tests/screenshots/documents-auth-check-2-signup.png',
          fullPage: true
        });

        // Click sign up button
        await page.getByRole('button', { name: /sign up/i }).click();

        // Wait for potential redirect or error
        await page.waitForTimeout(3000);

        const afterSignupUrl = page.url();
        console.log('URL after signup attempt:', afterSignupUrl);

        await page.screenshot({
          path: '/Users/g/dev/mffa/tests/screenshots/documents-auth-check-3-after-signup.png',
          fullPage: true
        });

        // If we're authenticated, try to navigate to documents again
        if (!afterSignupUrl.includes('/login') && !afterSignupUrl.includes('/signup')) {
          console.log('\n✓ Authentication successful! Navigating to documents...');

          await page.goto('http://localhost:3000/documents', {
            waitUntil: 'networkidle',
            timeout: 30000
          });

          await page.waitForTimeout(2000);

          await page.screenshot({
            path: '/Users/g/dev/mffa/tests/screenshots/documents-authenticated.png',
            fullPage: true
          });
        }
      }
    } else {
      console.log('\n✓ Already on documents page (no authentication required or already authenticated)');
    }

    // Final state capture
    const finalUrl = page.url();
    const pageTitle = await page.title();

    console.log('\n=== FINAL STATE ===');
    console.log('Final URL:', finalUrl);
    console.log('Page Title:', pageTitle);

    // Check for specific UI elements on documents page
    if (finalUrl.includes('/documents')) {
      console.log('\n--- Documents Page UI Check ---');

      const heading = await page.locator('h1, h2').first().textContent();
      console.log('Page Heading:', heading);

      const hasStatsCards = await page.locator('text=Total Documents').isVisible().catch(() => false);
      console.log('Stats cards visible:', hasStatsCards);

      const hasAddButton = await page.getByRole('button', { name: /add document/i }).isVisible().catch(() => false);
      console.log('Add Document button visible:', hasAddButton);
    }

    console.log('\n--- Console Messages (last 10) ---');
    const recentConsoleMessages = consoleMessages.slice(-10);
    if (recentConsoleMessages.length === 0) {
      console.log('No console messages');
    } else {
      recentConsoleMessages.forEach((msg, i) => {
        console.log(`[${i + 1}] [${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }

    console.log('\n--- Page Errors ---');
    if (pageErrors.length === 0) {
      console.log('No page errors');
    } else {
      pageErrors.forEach((error, i) => {
        console.log(`[${i + 1}] ${error}`);
      });
    }

    console.log('\n--- Network Errors ---');
    if (networkErrors.length === 0) {
      console.log('No network errors');
    } else {
      networkErrors.forEach((error, i) => {
        console.log(`[${i + 1}] ${error.url}`);
        if (error.status) console.log(`    Status: ${error.status}`);
        if (error.error) console.log(`    Error: ${error.error}`);
      });
    }

    console.log('\n=== SUMMARY ===');
    console.log('Successfully reached documents page:', finalUrl.includes('/documents'));
    console.log('Total Console Messages:', consoleMessages.length);
    console.log('Total Page Errors:', pageErrors.length);
    console.log('Total Network Errors:', networkErrors.length);
    console.log('\n=================================\n');
  });
});
