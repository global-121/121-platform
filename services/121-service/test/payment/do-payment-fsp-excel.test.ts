/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';

import { FinancialServiceProviderAttributes } from '@121-service/src/financial-service-providers/enum/financial-service-provider-attributes.enum';
import { FinancialServiceProviderConfigurationProperties } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ImportStatus } from '@121-service/src/registration/dto/bulk-import.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import programTest from '@121-service/src/seed-data/program/program-test.json';
import {
  doPayment,
  getFspInstructions,
  getTransactions,
  importFspReconciliationData,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  deleteProgramFinancialServiceProviderConfigurationProperty,
  getProgramFinancialServiceProviderConfigurations,
} from '@121-service/test/helpers/program-financial-service-provider-configuration.helper';
import {
  awaitChangePaStatus,
  getImportFspReconciliationTemplate,
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
  registrationWesteros3,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Do payment with Excel FSP', () => {
  let accessToken: string;
  // Payment info
  const amount = 10;
  const paymentNr = 1;

  // Registrations
  const registrationsWesteros = [
    registrationWesteros1,
    registrationWesteros2,
    registrationWesteros3,
  ];
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
      [TransactionStatusEnum.waiting],
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
      const fspInstructions = fspInstructionsResponse.body;

      // Assert
      for (const transaction of transactionsResponse.body) {
        expect(transaction.status).toBe(TransactionStatusEnum.waiting);
      }
      // Sort fspInstructions by phoneNumber
      expect(fspInstructions).toMatchSnapshot();
    });

    it('Should return all program-registration-attributes on Get FSP instruction with Excel-FSP when "columnsToExport" is not set', async () => {
      // Arrange
      const programAttributeColumns =
        programTest.programRegistrationAttributes.map((pa) => pa.name);
      programAttributeColumns.concat(['amount']);

      const fspConfigurations =
        await getProgramFinancialServiceProviderConfigurations({
          programId: programIdWesteros,
          accessToken,
        });

      for (const fspConfiguration of fspConfigurations.body) {
        await deleteProgramFinancialServiceProviderConfigurationProperty({
          programId: programIdWesteros,
          configName: fspConfiguration.name,
          propertyName:
            FinancialServiceProviderConfigurationProperties.columnsToExport,
          accessToken,
        });
      }

      // Act
      const fspInstructionsResponse = await getFspInstructions(
        programIdWesteros,
        paymentNr,
        accessToken,
      );
      // Assert
      expect(fspInstructionsResponse.statusCode).toBe(HttpStatus.OK);

      const fspInstructions = fspInstructionsResponse.body;

      expect(fspInstructions).toMatchSnapshot();
    });
  });

  describe('Import FSP reconciliation data', () => {
    it('Should update transaction status based on imported reconciliation data', async () => {
      // Arrange
      const matchColumn = FinancialServiceProviderAttributes.phoneNumber;
      // construct reconciliation-file here
      const reconciliationData = [
        {
          [matchColumn]: registrationWesteros1.phoneNumber,
          status: TransactionStatusEnum.success,
        },
        {
          [matchColumn]: registrationWesteros2.phoneNumber,
          status: TransactionStatusEnum.error,
        },
        {
          [matchColumn]: registrationWesteros3.phoneNumber,
          status: TransactionStatusEnum.success,
        },
        { [matchColumn]: '123456789', status: TransactionStatusEnum.error },
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
        [TransactionStatusEnum.success, TransactionStatusEnum.error], // Hmm, this is sort of stepping on the feet of the assert already
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
          expect(importResultRecord.importStatus).not.toBe(
            ImportStatus.notFound,
          );
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

    it('should give me a CSV template when I request it', async () => {
      const response =
        await getImportFspReconciliationTemplate(programIdWesteros);
      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.body.sort()).toMatchSnapshot();
    });

    it('Should give an error when status column is missing', async () => {
      // Arrange
      const matchColumn = FinancialServiceProviderAttributes.phoneNumber;
      // construct reconciliation-file here
      const reconciliationData = [
        {
          [matchColumn]: registrationWesteros1.phoneNumber,
        },
      ];

      // Act
      const importResult = await importFspReconciliationData(
        programIdWesteros,
        paymentNr,
        accessToken,
        reconciliationData,
      );
      expect(importResult.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(importResult.body).toMatchSnapshot();
    });
  });
});
