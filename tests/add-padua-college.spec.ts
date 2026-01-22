import { test, expect } from '@playwright/test';

test('Add Padua College Kedron for Elliot Moyle', async ({ page }) => {
  test.setTimeout(60000);

  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`PAGE ERROR: ${error.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`CONSOLE ERROR: ${msg.text()}`);
  });

  console.log('\n=== STEP 1: Navigate to Elliot Moyle ===');
  await page.goto('http://localhost:3000/family-members', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  const elliotLink = page.locator('a').filter({ hasText: 'Elliot Moyle' }).first();
  await elliotLink.click();
  await page.waitForTimeout(2000);

  console.log('\n=== STEP 2: Go to School tab ===');
  const schoolTab = page.getByRole('tab', { name: /school/i });
  await schoolTab.click();
  await page.waitForTimeout(2000);

  console.log('\n=== STEP 3: Click Add Enrolment ===');
  const addEnrolmentBtn = page.getByRole('button', { name: /add enrolment/i });
  await addEnrolmentBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/padua-01-dialog.png', fullPage: true });

  console.log('\n=== STEP 4: Select Padua College from dropdown ===');
  // Click the school dropdown
  const schoolDropdown = page.locator('[role="dialog"]').locator('button[role="combobox"]').first();
  await schoolDropdown.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/padua-02-dropdown-open.png', fullPage: true });

  // List available schools
  const allOptions = await page.locator('[role="option"]').allTextContents();
  console.log('Available schools:', allOptions);

  // Select the first Padua College (there may be duplicates from previous test runs)
  const paduaOption = page.locator('[role="option"]').filter({ hasText: 'Padua College' }).first();
  const paduaExists = await paduaOption.isVisible().catch(() => false);
  console.log('Padua College exists:', paduaExists);

  if (paduaExists) {
    await paduaOption.click();
    await page.waitForTimeout(500);
    console.log('Selected Padua College');
  } else {
    // Close dropdown and add new school
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    console.log('\n=== Creating new school ===');
    const plusBtn = page.locator('[role="dialog"]').locator('button').nth(1);
    await plusBtn.click();
    await page.waitForTimeout(1500);

    const nameInput = page.locator('input[placeholder*="Brisbane Grammar"]');
    await nameInput.fill('Padua College');
    await page.waitForTimeout(300);

    const typeDropdown = page.locator('button[role="combobox"]').filter({ hasText: 'Primary' });
    await typeDropdown.click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]').filter({ hasText: 'Secondary' }).click();
    await page.waitForTimeout(300);

    const sectorDropdown = page.locator('button[role="combobox"]').filter({ hasText: 'Select sector' });
    await sectorDropdown.click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]').filter({ hasText: 'Catholic' }).click();
    await page.waitForTimeout(300);

    const suburbInput = page.locator('input[placeholder="Suburb"]');
    await suburbInput.fill('Kedron');

    const addSchoolBtn = page.getByRole('button', { name: 'Add School' });
    await addSchoolBtn.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/padua-03-school-selected.png', fullPage: true });

  // Verify school is selected by checking the dropdown text
  const selectedSchool = await schoolDropdown.textContent();
  console.log('Currently selected school:', selectedSchool);

  console.log('\n=== STEP 5: Select year level ===');
  // Make sure dropdown is closed by clicking outside if needed
  await page.waitForTimeout(500);

  const yearDropdown = page.locator('[role="dialog"]').locator('button[role="combobox"]').filter({ hasText: /select year/i });
  const yearVisible = await yearDropdown.isVisible().catch(() => false);
  console.log('Year dropdown visible:', yearVisible);

  if (yearVisible) {
    await yearDropdown.click({ force: true }); // Use force to bypass intercepts
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/padua-04-year-dropdown.png', fullPage: true });

    const year10 = page.locator('[role="option"]').filter({ hasText: 'Year 10' });
    if (await year10.isVisible().catch(() => false)) {
      await year10.click();
      await page.waitForTimeout(300);
      console.log('Selected Year 10');
    }
  }

  await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/padua-05-enrolment-filled.png', fullPage: true });

  console.log('\n=== STEP 6: Submit enrolment ===');
  const enrolBtn = page.getByRole('button', { name: 'Enrol' });
  await enrolBtn.click();
  await page.waitForTimeout(3000);

  await page.screenshot({ path: '/Users/g/dev/mffa/tests/screenshots/padua-06-final.png', fullPage: true });

  console.log('\n=== FINAL ERRORS ===');
  if (errors.length > 0) {
    errors.forEach((e, i) => console.log(`${i + 1}. ${e}`));
  } else {
    console.log('No errors');
  }

  // Verify Elliot is enrolled at Padua
  const paduaEnrolment = page.locator('text=Padua College');
  const enrolled = await paduaEnrolment.isVisible().catch(() => false);
  console.log('Padua College visible on page:', enrolled);

  // Check School tab content
  const schoolTabContent = await page.locator('[data-state="active"]').textContent().catch(() => '');
  console.log('School tab content preview:', schoolTabContent?.substring(0, 200));
});
