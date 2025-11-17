/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import programTest from '@121-service/src/seed-data/program/program-test.json';
import {
  getFspInstructions,
  getTransactions,
} from '@121-service/test/helpers/program.helper';
import {
  deleteProgramFspConfigurationProperty,
  getProgramFspConfigurations,
} from '@121-service/test/helpers/program-fsp-configuration.helper';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
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
  // Registrations
  const registrationsWesteros = [
    registrationWesteros1,
    registrationWesteros2,
    registrationWesteros3,
  ];

  const registrationsProgramWithValidation = [registrationCbe];

  const programIdCbe = 1;

  let paymentIdWesteros: number;
  let voucherPaymentIdWesteros: number;
  let paymentIdCbe: number;

  const gringotts = 'gringotts';
  const ironBank = 'ironBank';

  const columnsToExportGringotts = (programTest.programFspConfigurations
    .find((p) => p.name === gringotts)!
    .properties.find(
      (prop) => prop.name === FspConfigurationProperties.columnsToExport,
    )?.value ?? []) as string[];
  const columnsToExportIronBank = (programTest.programFspConfigurations
    .find((p) => p.name === ironBank)!
    .properties.find(
      (prop) => prop.name === FspConfigurationProperties.columnsToExport,
    )?.value ?? []) as string[];

  // Function for all seeding
  const seedPrograms = async () => {
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();

    //////////////////////////
    // Setup Westeros program
    /////////////////////////

    paymentIdWesteros = await seedPaidRegistrations(
      registrationsWesteros,
      programIdWesteros,
      amount,
      [TransactionStatusEnum.waiting],
    );

    // also do another payment with a different fsp to test export where there is not transaction with excel fsp
    const voucherRegistrationWesteros = {
      ...registrationWesteros1,
      referenceId: 'AH-001',
      phoneNumber: '31612345678',
      programFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
    };

    voucherPaymentIdWesteros = await seedPaidRegistrations(
      [voucherRegistrationWesteros],
      programIdWesteros,
      amount,
      [TransactionStatusEnum.success, TransactionStatusEnum.error],
    );

    ////////////////////////////
    // Setup Validation program
    ////////////////////////////

    // Do more tests with multiple programs, to include data isolation in tests
    // Specifically, this enables testing if transactions and registrations have the same length (see excel.service.ts)
    // For CBE we don't have status awaiting, so only wait for success or error.
    paymentIdCbe = await seedPaidRegistrations(
      registrationsProgramWithValidation,
      programIdCbe,
      amount,
      [TransactionStatusEnum.success, TransactionStatusEnum.error],
    );
  };

  describe('Export FSP instructions successfully', () => {
    beforeEach(async () => {
      await seedPrograms();
    });
    it('Should return specified columns on Get FSP instruction with Excel-FSP when "columnsToExport" is set', async () => {
      // Arrange

      // Act
      const transactionsResponse = await getTransactions({
        programId: programIdWesteros,
        paymentId: paymentIdWesteros,
        registrationReferenceId: null,
        accessToken,
      });

      const fspInstructionsResponse = await getFspInstructions(
        programIdWesteros,
        paymentIdWesteros,
        accessToken,
      );
      const fspInstructions = fspInstructionsResponse.body;

      // Assert
      for (const transaction of transactionsResponse.body) {
        expect(transaction.status).toBe(TransactionStatusEnum.waiting);
      }
      // Sort fspInstructions by phoneNumber
      expect(fspInstructionsResponse.statusCode).toBe(HttpStatus.OK);

      // Find each instructions by fsp configuration name
      const fspInstructionsGringotts = fspInstructions.find(
        (f) => f.fileNamePrefix === gringotts,
      );
      const fspInstructionsIronBank = fspInstructions.find(
        (f) => f.fileNamePrefix === ironBank,
      );
      expect(fspInstructionsGringotts).toBeDefined();
      expect(fspInstructionsIronBank).toBeDefined();

      // Check if instructions contain the right data
      const gringottsData = fspInstructionsGringotts.data;
      const ironBankData = fspInstructionsIronBank.data;
      expect(gringottsData.length).toBe(1);
      expect(ironBankData.length).toBe(2);

      // Validate data per reference id
      const createFspInstructionObject = (
        registration: Record<string, unknown>,
        columnsToExport: string[],
      ): Record<string, unknown> => {
        // Any number for amount
        const obj: Record<string, unknown> = {
          amount: expect.any(Number), // Amount can differ per registration due payment amount calculation which is tested in different tests
          referenceId: registration.referenceId,
        };
        for (const column of columnsToExport) {
          obj[column] =
            registration[column] !== undefined
              ? String(registration[column])
              : '';
        }
        return obj;
      };

      const fspInstructionReg1 = ironBankData.find(
        (d) => d.referenceId === registrationWesteros1.referenceId,
      );
      expect(fspInstructionReg1).toEqual(
        createFspInstructionObject(
          registrationWesteros1,
          columnsToExportIronBank,
        ),
      );

      const fspInstructionReg2 = ironBankData.find(
        (d) => d.referenceId === registrationWesteros2.referenceId,
      );
      expect(fspInstructionReg2).toEqual(
        createFspInstructionObject(
          registrationWesteros2,
          columnsToExportIronBank,
        ),
      );

      const fspInstructionReg3 = gringottsData.find(
        (d) => d.referenceId === registrationWesteros3.referenceId,
      );
      expect(fspInstructionReg3).toEqual(
        createFspInstructionObject(
          registrationWesteros3,
          columnsToExportGringotts,
        ),
      );
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
        paymentIdWesteros,
        accessToken,
      );
      // Assert
      const programRegistrationAttributeNames =
        programTest.programRegistrationAttributes.map((pa) => pa.name);

      expect(fspInstructionsResponse.statusCode).toBe(HttpStatus.OK);

      const fspInstructions = fspInstructionsResponse.body;

      const expectedKeysPerRow = programRegistrationAttributeNames.concat([
        'amount',
        GenericRegistrationAttributes.referenceId,
      ]);
      for (const dataPerFsp of fspInstructions) {
        for (const row of dataPerFsp.data) {
          const fspInstructionColumns = Object.keys(row);
          expect(fspInstructionColumns.sort()).toEqual(
            expectedKeysPerRow.sort(),
          );
        }
      }
    });
  });

  describe('Error cases', () => {
    // None of these do write operations, so it's fine to not reset the DB only once
    beforeAll(async () => {
      await seedPrograms();
    });
    it("Sould throw an error if the payment doesn't exist", async () => {
      // Arrange
      const nonExistingPaymentId = 9999;

      // Act
      const fspInstructionsResponse = await getFspInstructions(
        programIdWesteros,
        nonExistingPaymentId,
        accessToken,
      );

      // Assert
      expect(fspInstructionsResponse.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(fspInstructionsResponse.body).toMatchSnapshot();
    });

    it('Should throw an error if program does not have Excel FSP configured', async () => {
      // Arrange

      // Act
      const fspInstructionsResponse = await getFspInstructions(
        programIdCbe,
        paymentIdCbe,
        accessToken,
      );

      // Assert
      expect(fspInstructionsResponse.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(fspInstructionsResponse.body).toMatchSnapshot();
    });

    it('Should throw an error if no transactions are found for the payment related to an excel FSP', async () => {
      // Act
      const fspInstructionsResponse = await getFspInstructions(
        programIdWesteros,
        voucherPaymentIdWesteros,
        accessToken,
      );

      // Assert
      expect(fspInstructionsResponse.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(fspInstructionsResponse.body).toMatchSnapshot();
    });
  });
});
