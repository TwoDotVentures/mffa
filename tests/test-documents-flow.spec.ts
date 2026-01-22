import { test, expect } from '@playwright/test';

test('Login and navigate to documents page with explicit delays', async ({ page }) => {
  test.setTimeout(60000); // Set 60 second timeout

  // Capture all console messages
  const consoleLogs: string[] = [];
  const consoleErrors: string[] = [];

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();

    if (type === 'error') {
      consoleErrors.push(text);
      console.log(`[CONSOLE ERROR]: ${text}`);
    } else {
      consoleLogs.push(`[${type}]: ${text}`);
      console.log(`[CONSOLE ${type}]: ${text}`);
    }
  });

  // Capture page errors
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.log(`[PAGE ERROR]: ${error.message}`);
  });

  console.log('=== Starting test ===');

  // Go to login page
  console.log('Navigating to login page...');
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');

  // Type email slowly
  console.log('Filling email...');
  await page.fill('input[type="email"]', 'grant.e.moyle@gmail.com');
  await page.waitForTimeout(2000); // pause 2 seconds

  // Type password
  console.log('Filling password...');
  await page.fill('input[type="password"]', 'TestPassword');
  await page.waitForTimeout(2000); // pause 2 seconds

  // Click sign in
  console.log('Clicking sign in button...');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(10000); // pause 10 seconds for auth to complete

  // Take screenshot to see where we are
  console.log('Taking screenshot after login...');
  await page.screenshot({ path: 'after-login.png', fullPage: true });

  // Now go to documents page
  console.log('Navigating to documents page...');
  await page.goto('http://localhost:3000/documents');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Take screenshot
  console.log('Taking screenshot of documents page...');
  await page.screenshot({ path: 'documents-page.png', fullPage: true });

  // Get page title and URL
  const title = await page.title();
  const url = page.url();

  console.log('\n=== TEST RESULTS ===');
  console.log(`Final URL: ${url}`);
  console.log(`Page Title: ${title}`);
  console.log(`\nTotal Console Messages: ${consoleLogs.length}`);
  console.log(`Total Console Errors: ${consoleErrors.length}`);
  console.log(`Total Page Errors: ${pageErrors.length}`);

  if (consoleErrors.length > 0) {
    console.log('\n=== CONSOLE ERRORS ===');
    consoleErrors.forEach((error, i) => {
      console.log(`${i + 1}. ${error}`);
    });
  }

  if (pageErrors.length > 0) {
    console.log('\n=== PAGE ERRORS ===');
    pageErrors.forEach((error, i) => {
      console.log(`${i + 1}. ${error}`);
    });
  }

  // Check if we're actually on the documents page
  const isOnDocumentsPage = url.includes('/documents');
  console.log(`\nSuccessfully reached documents page: ${isOnDocumentsPage}`);

  // Try to find key elements on the page
  console.log('\n=== PAGE ELEMENTS ===');

  const h1 = await page.locator('h1').first().textContent().catch(() => 'Not found');
  console.log(`H1 heading: ${h1}`);

  const uploadButton = await page.locator('button:has-text("Upload")').count();
  console.log(`Upload buttons found: ${uploadButton}`);

  const documentsTable = await page.locator('table').count();
  console.log(`Tables found: ${documentsTable}`);

  // Get the page HTML content to check what's rendered
  const bodyText = await page.locator('body').textContent();
  console.log(`\nPage body contains "Documents": ${bodyText?.includes('Documents')}`);
  console.log(`Page body contains "Upload": ${bodyText?.includes('Upload')}`);
  console.log(`Page body contains "No documents": ${bodyText?.includes('No documents')}`);
});
