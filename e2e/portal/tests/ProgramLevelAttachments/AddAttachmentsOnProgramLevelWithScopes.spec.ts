import { expect } from '@playwright/test';
import path from 'node:path';

import { env } from '@121-service/src/env';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const jpgFilePath = path.resolve(
  __dirname,
  '../../../test-file-upload-data/test-photo.jpg',
);

const scopes = [DebugScope.KisumuCentral, DebugScope.KisumuEast];

const uploadImageAttachment = async ({ programMonitoringPage }) => {
  await programMonitoringPage.uploadAttachment({
    filePath: jpgFilePath,
    filename: `Test ${path.basename(jpgFilePath, path.extname(jpgFilePath)).toUpperCase()} file upload`,
  });
};

const loginAsScopedUserCvaManager = async ({ login, scope }) => {
  await login({
    username: `${scope}@example.org`,
    password: env.USERCONFIG_121_SERVICE_PASSWORD_CVA_MANAGER,
  });
};

test.describe('Attachments on Program Level with Scope', () => {
  test.beforeAll(async ({ onlyResetAndSeedRegistrations }) => {
    // reset
    await onlyResetAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      skipSeedRegistrations: true,
    });
  });

  for (const scope of scopes) {
    test(`Upload a file as user with scope: ${scope}`, async ({
      page,
      login,
      tableComponent,
      programMonitoringPage,
    }) => {
      await test.step('Login and upload file as scoped user', async () => {
        await loginAsScopedUserCvaManager({
          login,
          scope,
        });
        await page.goto(`/en-GB/program/${programIdPV}/monitoring/files`);
        await uploadImageAttachment({ programMonitoringPage });
      });

      await test.step('Validate uploaded files', async () => {
        await page.waitForTimeout(200); // Wait for file to be present in the table
        await tableComponent.validateWaitForTableRowCount({
          expectedRowCount: 1,
        });

        const scopeColumnIndex =
          await tableComponent.getColumnIndexByHeaderText('Scope');
        const attachmentScopeName = await tableComponent.getTextArrayFromColumn(
          scopeColumnIndex + 1,
        ); // Adding 1 to the column index to get the correct column as the table component is 1-based index

        expect(attachmentScopeName[0]).toContain(scope);
      });
    });
  }

  test(`See all uploaded files as admin user`, async ({
    page,
    login,
    tableComponent,
  }) => {
    await test.step('Login and navigate to attachments page as admin user', async () => {
      await login({
        username: env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
        password: env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
      });
      await page.goto(`/en-GB/program/${programIdPV}/monitoring/files`);
    });

    await test.step('Validate all uploaded files are visible for admin user', async () => {
      await page.waitForTimeout(200); // Wait for file to be present in the table

      await tableComponent.validateWaitForTableRowCount({
        expectedRowCount: 2, // Expected row count is 2 as admin user should see both files uploaded by scoped users
      });

      const scopeColumnIndex =
        await tableComponent.getColumnIndexByHeaderText('Scope');
      const scopeNamesArray = await tableComponent.getTextArrayFromColumn(
        scopeColumnIndex + 1,
      ); // Adding 1 to the column index to get the correct column as the table component is 1-based index

      expect(scopeNamesArray).toContain(DebugScope.KisumuCentral);
      expect(scopeNamesArray).toContain(DebugScope.KisumuEast);
    });
  });
});
