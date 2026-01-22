import { test, expect } from '@playwright/test';

test('Detailed school add test', async ({ page }) => {
  // Capture ALL console messages
  const logs: string[] = [];
  page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (error) => logs.push(`[PAGE ERROR] ${error.message}`));
  page.on('response', (response) => {
    if (response.status() >= 400) {
      logs.push(`[HTTP ${response.status()}] ${response.url()}`);
    }
  });

  console.log('\n=== Navigate to Elliot detail page ===');
  await page.goto('http://localhost:3000/family-members', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Find Elliot and click
  const elliotLink = page.locator('a').filter({ hasText: 'Elliot Moyle' }).first();
  if (await elliotLink.isVisible()) {
    await elliotLink.click();
    await page.waitForTimeout(2000);
  }

  console.log('\n=== Click School tab ===');
  const schoolTab = page.getByRole('tab', { name: /school/i });
  await schoolTab.click();
  await page.waitForTimeout(3000); // Wait longer

  await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/school-detailed-01.png', fullPage: true });

  // Check for loading spinner
  const spinner = page.locator('.animate-spin');
  const stillLoading = await spinner.isVisible().catch(() => false);
  console.log('Still loading:', stillLoading);

  // Look for the "Add Enrolment" button
  const addEnrolmentBtn = page.getByRole('button', { name: /add enrolment/i });
  const hasAddBtn = await addEnrolmentBtn.isVisible().catch(() => false);
  console.log('Add Enrolment button visible:', hasAddBtn);

  if (hasAddBtn) {
    console.log('\n=== Click Add Enrolment ===');
    await addEnrolmentBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/school-detailed-02-dialog.png', fullPage: true });

    // Look for school selection or input
    const dialogContent = await page.locator('[role="dialog"]').textContent().catch(() => '');
    console.log('Dialog content preview:', dialogContent?.substring(0, 500));
  }

  console.log('\n=== Console/Error logs ===');
  const errorLogs = logs.filter(l => l.includes('ERROR') || l.includes('error') || l.includes('HTTP 4') || l.includes('HTTP 5'));
  if (errorLogs.length > 0) {
    errorLogs.forEach(l => console.log(l));
  } else {
    console.log('No errors detected');
  }

  await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/school-detailed-final.png', fullPage: true });
});
