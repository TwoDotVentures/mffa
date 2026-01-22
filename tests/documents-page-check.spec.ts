import { test, expect } from '@playwright/test';

test.describe('Documents Page Investigation', () => {
  test('Check for errors and take screenshot', async ({ page }) => {
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

    // Navigate to the documents page
    console.log('Navigating to http://localhost:3000/documents...');
    await page.goto('http://localhost:3000/documents', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a bit for any dynamic content
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: '/Users/g/dev/mffa/tests/screenshots/documents-page.png',
      fullPage: true
    });

    // Get page title and URL
    const pageTitle = await page.title();
    const pageUrl = page.url();

    // Log all findings
    console.log('\n=== PAGE INVESTIGATION RESULTS ===\n');
    console.log('Page Title:', pageTitle);
    console.log('Page URL:', pageUrl);

    console.log('\n--- Console Messages ---');
    if (consoleMessages.length === 0) {
      console.log('No console messages');
    } else {
      consoleMessages.forEach((msg, i) => {
        console.log(`[${i + 1}] [${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }

    console.log('\n--- Page Errors (JavaScript exceptions) ---');
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

    // Check for specific UI elements
    console.log('\n--- UI Elements Check ---');

    const hasHeading = await page.locator('h1, h2').first().isVisible().catch(() => false);
    console.log('Has visible heading:', hasHeading);

    const bodyText = await page.locator('body').textContent();
    console.log('Body contains text:', bodyText ? bodyText.substring(0, 200) + '...' : 'Empty');

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log('Total Console Messages:', consoleMessages.length);
    console.log('Total Page Errors:', pageErrors.length);
    console.log('Total Network Errors:', networkErrors.length);
    console.log('Screenshot saved to: /Users/g/dev/mffa/tests/screenshots/documents-page.png');
    console.log('\n=================================\n');

    // Create a detailed report object
    const report = {
      pageTitle,
      pageUrl,
      consoleMessages,
      pageErrors,
      networkErrors,
      hasVisibleHeading: hasHeading,
      timestamp: new Date().toISOString()
    };

    // Don't fail the test, just report findings
    console.log('Full Report Object:', JSON.stringify(report, null, 2));
  });
});
