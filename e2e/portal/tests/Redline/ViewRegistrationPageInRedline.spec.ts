import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import {
  projectIdWesteros,
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

test('[35447] View Redline start-page (no search)', async ({ page }) => {
  // Arrange

  // Act
  await page.goto('/en-GB/registration-lookup');

  // Assert
  await expect(page.locator('body')).toContainText(
    "When you receive a task, any information linked to the person's phone number found in active projects in the 121 Platform will appear here.",
  );
});

test('[35448] View error for no results', async ({ page }) => {
  // Arrange
  const testPhoneNumber = '0000000000';

  // Act
  await page.goto(`/en-GB/registration-lookup?phonenumber=${testPhoneNumber}`);

  // Assert
  await expect(page.locator('body')).toContainText(
    "We couldn't find any information linked to this person's phone number in the projects you have access to on the 121 Platform.",
  );
});

test('[35450] View search-result with single matched registration', async ({
  page,
}) => {
  // Arrange
  const testRegistrations = [registrationWesteros1];
  const testPhoneNumber = registrationWesteros1.phoneNumber;
  const testProjectRegistrationId = 2;
  await seedRegistrations(testRegistrations, projectIdWesteros);

  // Act
  await page.goto(`/en-GB/registration-lookup?phonenumber=${testPhoneNumber}`);

  // Assert
  await expect(page.locator('body')).toContainText(
    `${testRegistrations.length} registration(s) found with this number.`,
  );
  await page.waitForURL((url) => {
    return (
      url.pathname.endsWith(
        `/en-GB/project/${projectIdWesteros}/registrations/${testProjectRegistrationId}/activity-log`,
      ) && url.search.endsWith(`?phonenumber=${testPhoneNumber}`)
    );
  });
});

test('[35449] View search-results with multiple matched registrations', async ({
  page,
}) => {
  // Arrange
  const projectTitle = 'Cash project Westeros';
  const testPhoneNumber = registrationWesteros1.phoneNumber;
  const registrationWithSamePhoneNumber = {
    ...registrationWesteros2,
    phoneNumber: testPhoneNumber,
  };
  const testRegistrations = [
    registrationWesteros1,
    registrationWithSamePhoneNumber,
  ];
  await seedRegistrations(testRegistrations, projectIdWesteros);

  // Act
  await page.goto(`/en-GB/registration-lookup?phonenumber=${testPhoneNumber}`);

  // Assert
  await expect(page.locator('app-registration-lookup-menu')).toContainText(
    `${testRegistrations.length} registration(s) found with this number.`,
  );

  await expect(
    page.locator('app-registration-lookup-menu').getByRole('tab'),
  ).toHaveCount(testRegistrations.length);
  await expect(page.getByRole('tab').nth(0)).toHaveText(
    `${testRegistrations[0].fullName} - ${projectTitle}`,
  );
  await expect(
    page.locator('app-registration-lookup-menu').getByRole('tab').nth(1),
  ).toHaveText(`${testRegistrations[1].fullName} - ${projectTitle}`);
});
