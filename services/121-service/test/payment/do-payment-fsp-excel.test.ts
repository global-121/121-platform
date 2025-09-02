/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';

import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import { FspConfigurationProperties } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ImportStatus } from '@121-service/src/registration/dto/bulk-import.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import programTest from '@121-service/src/seed-data/program/program-test.json';
import {
  doPayment,
  getFspInstructions,
  getTransactions,
  importFspReconciliationData,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  deleteProgramFspConfigurationProperty,
  getProgramFspConfigurations,
} from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  awaitChangeRegistrationStatus,
  getImportFspReconciliationTemplate,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdWesteros,
  registrationCbe,
  registrationWesteros1,
  registrationWesteros2,
  registrationWesteros3,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Do payment with Excel FSP', () => {
  let accessToken: string;
  // Payment info
  const amount = 10;
  const paymentId = 1;

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

  const registrationsProgramWithValidation = [registrationCbe];
  const refrenceIdsWithValidation = [registrationCbe.referenceId];
  const programIdCbe = 1;

  beforeEach(async () => {
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();

    //////////////////////////
    // Setup Westeros program
    //////////////////////////
    await importRegistrations(
      programIdWesteros,
      registrationsWesteros,
      accessToken,
    );
    await awaitChangeRegistrationStatus({
      programId: programIdWesteros,
      referenceIds: referenceIdsWesteros,
      status: RegistrationStatusEnum.included,
      accessToken,
    });

    const paymentResponse = await doPayment({
      programId: programIdWesteros,
      amount,
      referenceIds: [],
      accessToken,
    });
    const pamymentIdWesteros = paymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      programId: programIdWesteros,
      paymentReferenceIds: referenceIdsWesteros,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatusses: [TransactionStatusEnum.waiting],
      paymentId: pamymentIdWesteros,
    });

    ////////////////////////////
    // Setup Validation program
    ////////////////////////////

    // Do more tests with multiple programs, to include data isolation in tests
    // Specifically, this enables testing if transactions and registrations have the same length (see excel.service.ts)
    await importRegistrations(
      programIdCbe,
      registrationsProgramWithValidation,
      accessToken,
    );
    await awaitChangeRegistrationStatus({
      programId: programIdCbe,
      referenceIds: refrenceIdsWithValidation,
      status: RegistrationStatusEnum.included,
      accessToken,
    });

    const paymentResponseCbe = await doPayment({
      programId: programIdCbe,
      amount,
      referenceIds: [],
      accessToken,
    });
    const paymentIdCbe = paymentResponseCbe.body.id;

    await waitForPaymentTransactionsToComplete({
      programId: programIdCbe,
      paymentReferenceIds: refrenceIdsWithValidation,
      accessToken,
      maxWaitTimeMs: 10_000,
      paymentId: paymentIdCbe,
    });
  });

  describe('Export FSP instructions', () => {
    it('Should return specified columns on Get FSP instruction with Excel-FSP when "columnsToExport" is set', async () => {
      // Arrange

      // Act
      const transactionsResponse = await getTransactions({
        programId: programIdWesteros,
        paymentId,
        registrationReferenceId: null,
        accessToken,
      });

      const fspInstructionsResponse = await getFspInstructions(
        programIdWesteros,
        paymentId,
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

      const fspConfigurations = await getProgramFspConfigurations({
        programId: programIdWesteros,
        accessToken,
      });

      for (const fspConfiguration of fspConfigurations.body) {
        await deleteProgramFspConfigurationProperty({
          programId: programIdWesteros,
          configName: fspConfiguration.name,
          propertyName: FspConfigurationProperties.columnsToExport,
          accessToken,
        });
      }

      // Act
      const fspInstructionsResponse = await getFspInstructions(
        programIdWesteros,
        paymentId,
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
      const matchColumn = FspAttributes.phoneNumber;
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
        paymentId,
        accessToken,
        reconciliationData,
      );
      const importResultRecords = JSON.parse(importResult.text).importResult;

      await waitForPaymentTransactionsToComplete(
        {
          programId: programIdWesteros,
          paymentReferenceIds: referenceIdsWesteros,
          accessToken,
          maxWaitTimeMs: 10_000,
          completeStatusses: [
            TransactionStatusEnum.success,
            TransactionStatusEnum.error,
          ],
        }, // Hmm, this is sort of stepping on the feet of the assert already
      );
      const transactionsResponse = await getTransactions({
        programId: programIdWesteros,
        paymentId,
        registrationReferenceId: null,
        accessToken,
      });

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
          (r) => r.referenceId === transaction.registrationReferenceId,
        )!;
        expect(registration).toBeDefined();
        const importRecord = reconciliationData.find(
          (r) => r[matchColumn] === registration[matchColumn],
        )!;
        expect(importRecord).toBeDefined();
        expect(transaction.status).toBe(importRecord.status);
      }
    });

    it(`Should give an error when there are duplicate values in the toMatch column`, async () => {
      // Arrange
      const matchColumn = FspAttributes.phoneNumber;
      const reconciliationData = [
        {
          [matchColumn]: registrationWesteros1.phoneNumber,
          status: TransactionStatusEnum.success,
        },
        {
          [matchColumn]: registrationWesteros1.phoneNumber,
          status: TransactionStatusEnum.error,
        },
      ];

      // Act
      const importResult = await importFspReconciliationData(
        programIdWesteros,
        paymentId,
        accessToken,
        reconciliationData,
      );

      // Assert
      expect(importResult.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(importResult.body).toMatchSnapshot();
    });

    it('should give me a CSV template when I request it', async () => {
      const response =
        await getImportFspReconciliationTemplate(programIdWesteros);
      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.body.sort()).toMatchSnapshot();
    });

    it('Should give an error when status column is missing', async () => {
      // Arrange
      const matchColumn = FspAttributes.phoneNumber;
      // construct reconciliation-file here
      const reconciliationData = [
        {
          [matchColumn]: registrationWesteros1.phoneNumber,
        },
      ];

      // Act
      const importResult = await importFspReconciliationData(
        programIdWesteros,
        paymentId,
        accessToken,
        reconciliationData,
      );
      expect(importResult.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(importResult.body).toMatchSnapshot();
    });
  });
});
