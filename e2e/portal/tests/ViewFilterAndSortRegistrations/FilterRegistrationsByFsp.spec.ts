import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

let registrationName: string;
const ahVoucherFsp = 'Albert Heijn voucher WhatsApp';
const visaFsp = 'Visa debit card';

test('Filter registrations by FSP (from the bug)', async ({
  registrationsPage,
  tableComponent,
  resetDBAndSeedRegistrations,
}) => {
  await test.step('Setup and seed database', async () => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: registrationsPV,
      programId: programIdPV,
      seedWithStatus: RegistrationStatusEnum.included,
      navigateToPage: `/program/${programIdPV}/registrations`,
    });
  });

  // Act & Assert
  // First ensure the FSP column is visible
  await test.step('Display FSP column in the table', async () => {
    await registrationsPage.configureTableColumns({ columns: ['FSP'] });
  });

  // Test filtering by Visa FSP
  await test.step('Filter FSP column by Visa debit card', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'FSP',
      selection: visaFsp,
    });

    registrationName =
      await registrationsPage.getFirstRegistrationNameFromTable();
    await tableComponent.validateLabelInTableByRegistrationName(
      registrationName,
      visaFsp,
    );
    await tableComponent.validateAllRecordsCount(2);
    await tableComponent.clearAllFilters();
  });

  // Test filtering by Albert Heijn voucher FSP
  await test.step('Filter FSP column by Albert Heijn voucher', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'FSP',
      selection: ahVoucherFsp,
    });

    registrationName =
      await registrationsPage.getFirstRegistrationNameFromTable();
    await tableComponent.validateLabelInTableByRegistrationName(
      registrationName,
      ahVoucherFsp,
    );
    await tableComponent.validateAllRecordsCount(2);
  });
});
