import { test, expect } from '@playwright/test';

test.describe('Add School for Family Member', () => {
  test('Add Elliot Moyle and enroll at Padua College Kedron', async ({ page }) => {
    // Capture errors
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(`PAGE ERROR: ${error.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`CONSOLE ERROR: ${msg.text()}`);
    });

    console.log('\n=== STEP 1: Navigate to Family Members ===');
    await page.goto('http://localhost:3000/family-members', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/school-01-family-page.png', fullPage: true });
    console.log('URL:', page.url());

    // Check if Elliot already exists
    const elliotExists = await page.locator('text=Elliot Moyle').isVisible().catch(() => false);
    console.log('Elliot Moyle exists:', elliotExists);

    if (!elliotExists) {
      console.log('\n=== STEP 2: Add Elliot Moyle ===');

      // Click Add Member button
      const addMemberBtn = page.getByRole('button', { name: /add member/i }).first();
      await addMemberBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/school-02-add-member-dialog.png', fullPage: true });

      // Fill in Elliot's details
      await page.locator('input[name="name"]').fill('Elliot Moyle');

      // Select member type = child
      await page.locator('button[role="combobox"]').first().click();
      await page.waitForTimeout(200);
      await page.locator('[role="option"]').filter({ hasText: 'Child' }).click();
      await page.waitForTimeout(200);

      await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/school-03-member-filled.png', fullPage: true });

      // Submit
      const submitBtn = page.getByRole('button', { name: /add member/i }).last();
      await submitBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/school-04-after-add-member.png', fullPage: true });

      // Check for errors
      if (errors.length > 0) {
        console.log('Errors after adding member:', errors);
      }
    }

    console.log('\n=== STEP 3: Navigate to Elliot\'s detail page ===');
    // Click on Elliot to go to detail page
    const elliotLink = page.locator('a').filter({ hasText: 'Elliot Moyle' }).first();
    if (await elliotLink.isVisible()) {
      await elliotLink.click();
      await page.waitForTimeout(1500);
    } else {
      // Try navigating directly if link not found
      await page.goto('http://localhost:3000/family-members', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/school-05-member-detail.png', fullPage: true });
    console.log('Current URL:', page.url());

    console.log('\n=== STEP 4: Navigate to School tab ===');
    // Click on School tab if we're on member detail page
    const schoolTab = page.getByRole('tab', { name: /school/i });
    if (await schoolTab.isVisible().catch(() => false)) {
      await schoolTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/school-06-school-tab.png', fullPage: true });
    } else {
      console.log('School tab not visible');
    }

    console.log('\n=== STEP 5: Try to add school/enrolment ===');
    // Look for Add School or Add Enrolment button
    const addSchoolBtn = page.getByRole('button', { name: /add school|add enrolment|enrol/i });
    if (await addSchoolBtn.isVisible().catch(() => false)) {
      await addSchoolBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/school-07-add-school-dialog.png', fullPage: true });

      // Try to fill in Padua College details
      const schoolNameInput = page.locator('input[name="name"], input[placeholder*="school" i]').first();
      if (await schoolNameInput.isVisible().catch(() => false)) {
        await schoolNameInput.fill('Padua College');
      }

      // Look for other fields
      const suburbInput = page.locator('input[name="suburb"], input[placeholder*="suburb" i]');
      if (await suburbInput.isVisible().catch(() => false)) {
        await suburbInput.fill('Kedron');
      }

      await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/school-08-school-filled.png', fullPage: true });

      // Try to submit
      const saveBtn = page.getByRole('button', { name: /save|add|create|submit/i }).last();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
      }
    } else {
      console.log('Add School button not found');
      // Take screenshot of current state
      await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/school-07-no-add-button.png', fullPage: true });
    }

    await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/school-09-final-state.png', fullPage: true });

    console.log('\n=== SUMMARY ===');
    console.log('Final URL:', page.url());
    console.log('Errors encountered:', errors.length);
    if (errors.length > 0) {
      errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    }
  });
});
