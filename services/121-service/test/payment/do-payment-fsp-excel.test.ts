/* eslint-disable jest/no-conditional-expect */
import {
  FinancialServiceProviderConfigurationEnum,
  FinancialServiceProviderName,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { ImportStatus } from '@121-service/src/registration/dto/bulk-import.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import programTest from '@121-service/src/seed-data/program/program-test.json';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import {
  deleteFspConfiguration,
  doPayment,
  getFspConfiguration,
  getFspInstructions,
  getTransactions,
  importFspReconciliationData,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangePaStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdWesteros,
  programIdWithValidation,
  registrationPV5,
  registrationWesteros1,
  registrationWesteros2,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Do payment with Excel FSP', () => {
  let accessToken: string;
  // Payment info
  const amount = 10;
  const paymentNr = 1;

  // Registrations
  const registrationsWesteros = [registrationWesteros1, registrationWesteros2];
  const referenceIdsWesteros = registrationsWesteros.map(
    (registration) => registration.referenceId,
  );
  const phoneNumbersWesteros = registrationsWesteros.map(
    (registration) => registration.phoneNumber,
  );

  const registrationsProgramWithValidation = [registrationPV5];
  const refrenceIdsWithValidation = [registrationPV5.referenceId];

  beforeEach(async () => {
    await resetDB(SeedScript.testMultiple);
    accessToken = await getAccessToken();

    //////////////////////////
    // Setup Westeros program
    //////////////////////////
    await importRegistrations(
      programIdWesteros,
      registrationsWesteros,
      accessToken,
    );
    await awaitChangePaStatus(
      programIdWesteros,
      referenceIdsWesteros,
      RegistrationStatusEnum.included,
      accessToken,
    );

    await doPayment(programIdWesteros, paymentNr, amount, [], accessToken);

    await waitForPaymentTransactionsToComplete(
      programIdWesteros,
      referenceIdsWesteros,
      accessToken,
      10_000,
      [StatusEnum.waiting],
    );

    ////////////////////////////
    // Setup Validation program
    ////////////////////////////

    // Do more tests with multiple programs, to include data isolation in tests
    // Specifically, this enables testing if transactions and registrations have the same length (see excel.service.ts)
    await importRegistrations(
      programIdWithValidation,
      registrationsProgramWithValidation,
      accessToken,
    );
    await awaitChangePaStatus(
      programIdWithValidation,
      refrenceIdsWithValidation,
      RegistrationStatusEnum.included,
      accessToken,
    );

    await doPayment(
      programIdWithValidation,
      paymentNr,
      amount,
      [],
      accessToken,
    );

    await waitForPaymentTransactionsToComplete(
      programIdWithValidation,
      refrenceIdsWithValidation,
      accessToken,
      10_000,
    );
  });

  describe('Export FSP instructions', () => {
    it('Should return specified columns on Get FSP instruction with Excel-FSP when "columnsToExport" is set', async () => {
      // Arrange
      const configValue = programTest.financialServiceProviders
        .find((fsp) => fsp.fsp === FinancialServiceProviderName.excel)
        ?.configuration?.find(
          (c) =>
            c.name ===
            FinancialServiceProviderConfigurationEnum.columnsToExport,
        );

      const columns = Array.isArray(configValue?.value)
        ? [...configValue.value, 'amount']
        : [];

      // Act
      const transactionsResponse = await getTransactions(
        programIdWesteros,
        paymentNr,
        null,
        accessToken,
      );

      const fspInstructionsResponse = await getFspInstructions(
        programIdWesteros,
        paymentNr,
        accessToken,
      );
      const fspInstructions = fspInstructionsResponse.body.data;

      // Assert
      // Check if transactions are on 'waiting' status
      for (const transaction of transactionsResponse.body) {
        expect(transaction.status).toBe(StatusEnum.waiting);
      }

      // Also check if the right amount of transactions are created
      expect(fspInstructions.length).toBe(referenceIdsWesteros.length);

      // Also check if the right phonenumber are in the transactions
      expect(fspInstructions.map((r) => r.phoneNumber).sort()).toEqual(
        phoneNumbersWesteros.sort(),
      );

      // Check if the rows are created with the right values
      for (const row of fspInstructions) {
        const registration = registrationsWesteros.find(
          (r) => r.name === row.name,
        )!;
        expect(registration).toBeDefined();
        for (const [key, value] of Object.entries(row)) {
          if (key === 'amount') {
            const multipliedAmount = amount * (registration.dragon + 1);
            expect(value).toBe(multipliedAmount);
          } else {
            expect(value).toEqual(String(registration[key]));
          }
        }
      }

      // Check if the right columns are exported
      const columnsInFspInstructions = Object.keys(fspInstructions[0]);
      expect(columnsInFspInstructions.sort()).toEqual(columns.sort());
    });

    it('Should return all program-question/program-custom attributes on Get FSP instruction with Excel-FSP when "columnsToExport" is not set', async () => {
      // Arrange
      const programAttributeColumns = programTest.programCustomAttributes.map(
        (pa) => pa.name,
      );
      const programQuestionColumns = programTest.programQuestions.map(
        (pq) => pq.name,
      );
      const columns = programAttributeColumns
        .concat(programQuestionColumns)
        .concat(['amount']);

      const fspConfig = await getFspConfiguration(
        programIdWesteros,
        accessToken,
      );
      const columnsToExportFspConfigRecord = fspConfig.body.find(
        (c) =>
          c.name === FinancialServiceProviderConfigurationEnum.columnsToExport,
      );
      await deleteFspConfiguration(
        programIdWesteros,
        columnsToExportFspConfigRecord.id,
        accessToken,
      );

      // Act
      const fspInstructionsResponse = await getFspInstructions(
        programIdWesteros,
        paymentNr,
        accessToken,
      );
      const fspInstructions = fspInstructionsResponse.body.data;

      const namesWesteros = registrationsWesteros.map((r) => r.name);
      // Also check if the right names are in the transactions
      expect(fspInstructions.map((r) => r.name).sort()).toEqual(
        namesWesteros.sort(),
      );

      // Check if the right columns are exported
      const columnsInFspInstructions = Object.keys(fspInstructions[0]);
      expect(columnsInFspInstructions.sort()).toEqual(columns.sort());

      // Assert if the values are correct
      for (const row of fspInstructions) {
        const registration = registrationsWesteros.find(
          (r) => r.name === row.name,
        )!;
        for (const [key, value] of Object.entries(row)) {
          expect(registration).toBeDefined();
          if (key === 'amount') {
            const multipliedAmount = amount * (registration.dragon + 1);
            expect(value).toBe(multipliedAmount);
          } else {
            expect(value).toEqual(String(registration[key]));
          }
        }
      }
    });
  });

  describe('Import FSP reconciliation data', () => {
    it('Should update transaction status based on imported reconciliation data', async () => {
      // Arrange
      const matchColumn = 'phoneNumber';
      // construct reconciliation-file here
      const reconciliationData = [
        {
          [matchColumn]: registrationWesteros1.phoneNumber,
          status: StatusEnum.success,
        },
        {
          [matchColumn]: registrationWesteros2.phoneNumber,
          status: StatusEnum.error,
        },
        { [matchColumn]: '123456789', status: StatusEnum.error },
      ];

      // Act
      const importResult = await importFspReconciliationData(
        programIdWesteros,
        paymentNr,
        accessToken,
        reconciliationData,
      );
      const importResultRecords = JSON.parse(importResult.text).importResult;

      await waitForPaymentTransactionsToComplete(
        programIdWesteros,
        referenceIdsWesteros,
        accessToken,
        10_000,
        [StatusEnum.success, StatusEnum.error], // Hmm, this is sort of stepping on the feet of the assert already
      );
      const transactionsResponse = await getTransactions(
        programIdWesteros,
        paymentNr,
        null,
        accessToken,
      );

      // Assert
      // Check per import record if it is imported or not found
      for (const importResultRecord of importResultRecords) {
        if (phoneNumbersWesteros.includes(importResultRecord[matchColumn])) {
          expect(importResultRecord.importStatus).toBe(ImportStatus.imported);
        } else {
          expect(importResultRecord.importStatus).toBe(ImportStatus.notFound);
        }
      }
      // Check for updated transaction if the status matches the imported status
      for (const transaction of transactionsResponse.body) {
        const registration = registrationsWesteros.find(
          (r) => r.referenceId === transaction.referenceId,
        )!;
        expect(registration).toBeDefined();
        const importRecord = reconciliationData.find(
          (r) => r[matchColumn] === registration[matchColumn],
        )!;
        expect(importRecord).toBeDefined();
        expect(transaction.status).toBe(importRecord.status);
      }
    });
  });
});
