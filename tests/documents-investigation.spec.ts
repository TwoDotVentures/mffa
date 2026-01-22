import { test, expect, type Page } from '@playwright/test';

test.describe('Documents Page Error Investigation', () => {
  let consoleLogs: Array<{ type: string; text: string; location?: string }> = [];
  let networkErrors: Array<{ url: string; status: number; statusText: string }> = [];
  let pageErrors: Array<string> = [];

  test('investigate documents page errors', async ({ page }) => {
    // Capture console logs
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location();

      consoleLogs.push({
        type,
        text,
        location: location ? `${location.url}:${location.lineNumber}:${location.columnNumber}` : undefined
      });

      console.log(`[CONSOLE ${type.toUpperCase()}] ${text}`);
      if (location) {
        console.log(`  Location: ${location.url}:${location.lineNumber}:${location.columnNumber}`);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      const errorMsg = `${error.name}: ${error.message}\n${error.stack}`;
      pageErrors.push(errorMsg);
      console.log(`[PAGE ERROR] ${errorMsg}`);
    });

    // Capture network failures
    page.on('response', (response) => {
      if (response.status() >= 400) {
        const error = {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        };
        networkErrors.push(error);
        console.log(`[NETWORK ERROR] ${error.status} ${error.statusText} - ${error.url}`);
      }
    });

    // Capture request failures
    page.on('requestfailed', (request) => {
      console.log(`[REQUEST FAILED] ${request.url()}`);
      console.log(`  Failure: ${request.failure()?.errorText}`);
    });

    console.log('\n=== STEP 1: Navigating to login page ===');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

    // Take screenshot of login page
    await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/01-login-page.png', fullPage: true });
    console.log('Screenshot saved: 01-login-page.png');

    console.log('\n=== STEP 2: Filling login form ===');
    await page.fill('input[type="email"]', 'grant.e.moyle@gmail.com');
    await page.fill('input[type="password"]', 'TestPassword');

    // Take screenshot before login
    await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/02-before-login.png', fullPage: true });
    console.log('Screenshot saved: 02-before-login.png');

    console.log('\n=== STEP 3: Submitting login ===');
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL(/\/(?!login)/, { timeout: 10000 }).catch((e) => {
      console.log('Navigation timeout or error:', e.message);
    });

    // Take screenshot after login
    await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/03-after-login.png', fullPage: true });
    console.log('Screenshot saved: 03-after-login.png');

    console.log('\n=== STEP 4: Navigating to documents page ===');
    await page.goto('http://localhost:3000/documents', { waitUntil: 'networkidle' });

    // Wait a bit for any async operations
    await page.waitForTimeout(2000);

    // Take screenshot of documents page
    await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/04-documents-page.png', fullPage: true });
    console.log('Screenshot saved: 04-documents-page.png');

    // Check what's rendered on the page
    const pageContent = await page.content();
    const bodyText = await page.locator('body').textContent();

    console.log('\n=== PAGE CONTENT ANALYSIS ===');
    console.log('Page title:', await page.title());
    console.log('Current URL:', page.url());
    console.log('Body text preview:', bodyText?.slice(0, 500));

    // Check for specific error elements
    const errorElements = await page.locator('[role="alert"], .error, [data-error]').all();
    if (errorElements.length > 0) {
      console.log('\n=== ERROR ELEMENTS FOUND ===');
      for (const element of errorElements) {
        console.log('Error element text:', await element.textContent());
      }
    }

    // Final wait to capture any delayed logs
    await page.waitForTimeout(2000);

    console.log('\n=== SUMMARY ===');
    console.log(`Total console logs: ${consoleLogs.length}`);
    console.log(`Total page errors: ${pageErrors.length}`);
    console.log(`Total network errors: ${networkErrors.length}`);

    console.log('\n=== CONSOLE ERRORS ===');
    const errors = consoleLogs.filter(log => log.type === 'error');
    errors.forEach((log, i) => {
      console.log(`\nError ${i + 1}:`);
      console.log(`  Message: ${log.text}`);
      if (log.location) {
        console.log(`  Location: ${log.location}`);
      }
    });

    console.log('\n=== CONSOLE WARNINGS ===');
    const warnings = consoleLogs.filter(log => log.type === 'warning');
    warnings.forEach((log, i) => {
      console.log(`\nWarning ${i + 1}:`);
      console.log(`  Message: ${log.text}`);
      if (log.location) {
        console.log(`  Location: ${log.location}`);
      }
    });

    console.log('\n=== PAGE ERRORS ===');
    pageErrors.forEach((error, i) => {
      console.log(`\nPage Error ${i + 1}:`);
      console.log(error);
    });

    console.log('\n=== NETWORK ERRORS ===');
    networkErrors.forEach((error, i) => {
      console.log(`\nNetwork Error ${i + 1}:`);
      console.log(`  Status: ${error.status} ${error.statusText}`);
      console.log(`  URL: ${error.url}`);
    });

    // Save detailed report
    const report = {
      summary: {
        totalConsoleLogs: consoleLogs.length,
        totalPageErrors: pageErrors.length,
        totalNetworkErrors: networkErrors.length,
        pageUrl: page.url(),
        pageTitle: await page.title()
      },
      consoleLogs,
      pageErrors,
      networkErrors,
      timestamp: new Date().toISOString()
    };

    // Write report to file
    const fs = require('fs');
    const reportPath = '/Users/g/dev/mffa/tests/error-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nDetailed report saved to: ${reportPath}`);
  });
});
