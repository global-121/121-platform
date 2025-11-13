import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import {
  programIdWesteros,
  registrationWesteros1,
  registrationWesteros2,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.testMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);

  await page.goto('/');
  await loginPage.login();
});

test('View Redline start-page (no search)', async ({ page }) => {
  // Arrange

  // Act
  await page.goto('/en-GB/registration-lookup');

  // Assert
  await expect(page.locator('body')).toContainText(
    "When you receive a task, any information linked to the person's phone number found in active programs in the 121 Platform will appear here.",
  );
});

test('View error for no results', async ({ page }) => {
  // Arrange
  const testPhoneNumber = '0000000000';

  // Act
  await page.goto(`/en-GB/registration-lookup?phonenumber=${testPhoneNumber}`);

  // Assert
  await expect(page.locator('body')).toContainText(
    "We couldn't find any information linked to this person's phone number in the programs you have access to on the 121 Platform.",
  );
});

test('View search-result with single matched registration', async ({
  page,
}) => {
  // Arrange
  const testRegistrations = [registrationWesteros1];
  const testPhoneNumber = registrationWesteros1.phoneNumber;
  const testProgramRegistrationId = 2;
  await seedRegistrations(testRegistrations, programIdWesteros);

  // Act
  await page.goto(`/en-GB/registration-lookup?phonenumber=${testPhoneNumber}`);

  // Assert
  await expect(page.locator('body')).toContainText(
    `${testRegistrations.length} registration(s) found with this number.`,
  );
  await page.waitForURL((url) => {
    return (
      url.pathname.endsWith(
        `/en-GB/program/${programIdWesteros}/registrations/${testProgramRegistrationId}/activity-log`,
      ) && url.search.endsWith(`?phonenumber=${testPhoneNumber}`)
    );
  });
});

test('View search-results with multiple matched registrations', async ({
  page,
}) => {
  // Arrange
  const programTitle = 'Cash program Westeros';
  const testPhoneNumber = registrationWesteros1.phoneNumber;
  const registrationWithSamePhoneNumber = {
    ...registrationWesteros2,
    phoneNumber: testPhoneNumber,
  };
  const testRegistrations = [
    registrationWesteros1,
    registrationWithSamePhoneNumber,
  ];
  await seedRegistrations(testRegistrations, programIdWesteros);

  // Act
  await page.goto(`/en-GB/registration-lookup?phonenumber=${testPhoneNumber}`);

  // Assert
  await expect(page.locator('app-registration-lookup-menu')).toContainText(
    `${testRegistrations.length} registration(s) found with this number.`,
  );
  // Check that the number of tabs equals the number of test registrations
  await expect(
    page.locator('app-registration-lookup-menu').getByRole('tab'),
  ).toHaveCount(testRegistrations.length);

  // Check that both expected tab texts are present
  const expectedTabTexts = testRegistrations.map(
    (registration) => `${registration.fullName} - ${programTitle}`,
  );

  for (const expectedText of expectedTabTexts) {
    await expect(
      page
        .locator('app-registration-lookup-menu')
        .getByRole('tab', { name: expectedText }),
    ).toBeVisible();
  }
});
