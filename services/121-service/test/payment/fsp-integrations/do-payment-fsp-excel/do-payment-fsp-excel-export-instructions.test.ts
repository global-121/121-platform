import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import programTest from '@121-service/src/seed-data/program/program-test.json';
import {
  getFspInstructions,
  getTransactionsByPaymentIdPaginated,
} from '@121-service/test/helpers/program.helper';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getServer,
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
  const transferValue = 10;
  // Registrations
  const registrationsWesteros = [
    registrationWesteros1,
    registrationWesteros2,
    registrationWesteros3,
  ];

  const registrationsProgramWithValidation = [registrationCbe];

  const programIdCbe = 1;

  let excelPaymentIdWesteros: number;
  let voucherPaymentIdWesteros: number;
  let paymentIdCbe: number;

  const gringotts = 'gringotts';
  const ironBank = 'ironBank';

  const gringottsConfiguration = programTest.programFspConfigurations.find(
    (configuration) => configuration.name === gringotts,
  ) as { uniqueIdentifierField: string; exportFields: string[] };
  const ironBankConfiguration = programTest.programFspConfigurations.find(
    (configuration) => configuration.name === ironBank,
  ) as { uniqueIdentifierField: string; exportFields: string[] };

  // Function for all seeding
  const seedPrograms = async () => {
    await resetDB({ seedScript: SeedScript.testMultiple });
    accessToken = await getAccessToken();

    //////////////////////////
    // Setup Westeros program
    /////////////////////////

    // Westeros registrations use Excel FSP, so the status we wait for is
    // 'waiting'. No other status makes sense here.
    excelPaymentIdWesteros = await seedPaidRegistrations({
      registrations: registrationsWesteros,
      programId: programIdWesteros,
      transferValue,
      completeStatuses: [TransactionStatusEnum.waiting],
    });

    // also do another payment with a different fsp to test export where there is not transaction with excel fsp
    const voucherRegistrationWesteros = {
      ...registrationWesteros1,
      referenceId: 'AH-001',
      phoneNumber: '31612345678',
      whatsappPhoneNumber: '31612345678',
      programFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
    };

    // We want to wait until it's complete so, wait for success or error.
    voucherPaymentIdWesteros = await seedPaidRegistrations({
      registrations: [voucherRegistrationWesteros],
      programId: programIdWesteros,
      transferValue,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });

    ////////////////////////////
    // Setup Validation program
    ////////////////////////////

    // This adds more data, the goal is to *not* see this data in the exports.
    // Specifically, this enables testing if transactions and registrations have the same length (see excel.service.ts)
    // For CBE we don't have status awaiting, so only wait for success or error.
    paymentIdCbe = await seedPaidRegistrations({
      registrations: registrationsProgramWithValidation,
      programId: programIdCbe,
      transferValue,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });
  };

  describe('Export FSP instructions successfully', () => {
    beforeEach(async () => {
      await seedPrograms();
    });

    it('Should return specified fields on Get FSP instruction with Excel-FSP when export fields are set', async () => {
      // Arrange

      // Act
      const transactionsResponse = await getTransactionsByPaymentIdPaginated({
        programId: programIdWesteros,
        paymentId: excelPaymentIdWesteros,
        registrationReferenceId: null,
        accessToken,
      });

      const fspInstructionsResponse = await getFspInstructions(
        programIdWesteros,
        excelPaymentIdWesteros,
        accessToken,
      );
      const fspInstructions = fspInstructionsResponse.body;

      // Assert
      for (const transaction of transactionsResponse.body.data) {
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
        exportFields: string[],
        uniqueIdentifierField: string,
      ): Record<string, unknown> => {
        // Any number for amount
        const obj: Record<string, unknown> = {
          amount: expect.any(Number), // Amount can differ per registration due payment amount calculation which is tested in different tests
          referenceId: registration.referenceId,
        };
        for (const field of new Set([
          ...exportFields,
          uniqueIdentifierField,
        ])) {
          obj[field] =
            registration[field] !== undefined
              ? String(registration[field])
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
          ironBankConfiguration.exportFields,
          ironBankConfiguration.uniqueIdentifierField,
        ),
      );

      const fspInstructionReg2 = ironBankData.find(
        (d) => d.referenceId === registrationWesteros2.referenceId,
      );
      expect(fspInstructionReg2).toEqual(
        createFspInstructionObject(
          registrationWesteros2,
          ironBankConfiguration.exportFields,
          ironBankConfiguration.uniqueIdentifierField,
        ),
      );

      const fspInstructionReg3 = gringottsData.find(
        (d) => d.referenceId === registrationWesteros3.referenceId,
      );
      expect(fspInstructionReg3).toEqual(
        createFspInstructionObject(
          registrationWesteros3,
          gringottsConfiguration.exportFields,
          gringottsConfiguration.uniqueIdentifierField,
        ),
      );
    });

    it('Should include the unique identifier field when it is not part of the export fields', async () => {
      // Arrange
      expect(gringottsConfiguration.exportFields).not.toContain(
        gringottsConfiguration.uniqueIdentifierField,
      );

      // Act
      const fspInstructionsResponse = await getFspInstructions(
        programIdWesteros,
        excelPaymentIdWesteros,
        accessToken,
      );

      // Assert
      expect(fspInstructionsResponse.statusCode).toBe(HttpStatus.OK);
      const fspInstructionsGringotts = fspInstructionsResponse.body.find(
        (f) => f.fileNamePrefix === gringotts,
      );
      const fspInstructionReg3 = fspInstructionsGringotts.data.find(
        (d) => d.referenceId === registrationWesteros3.referenceId,
      );
      expect(
        fspInstructionReg3[gringottsConfiguration.uniqueIdentifierField],
      ).toBe(
        String(
          registrationWesteros3[gringottsConfiguration.uniqueIdentifierField],
        ),
      );
    });

    it('Should default to all registration attributes when export fields are omitted', async () => {
      // Arrange
      for (const [name, configuration] of [
        [gringotts, gringottsConfiguration],
        [ironBank, ironBankConfiguration],
      ] as const) {
        await getServer()
          .put(
            `/programs/${programIdWesteros}/fsp-configurations/${name}/excel`,
          )
          .set('Cookie', [accessToken])
          .send({ uniqueIdentifierField: configuration.uniqueIdentifierField });
      }

      // Act
      const fspInstructionsResponse = await getFspInstructions(
        programIdWesteros,
        excelPaymentIdWesteros,
        accessToken,
      );
      // Assert
      expect(fspInstructionsResponse.statusCode).toBe(HttpStatus.OK);

      const fspInstructions = fspInstructionsResponse.body;
      for (const dataPerFsp of fspInstructions) {
        const configuration =
          dataPerFsp.fileNamePrefix === gringotts
            ? gringottsConfiguration
            : ironBankConfiguration;
        const expectedKeysPerRow = [
          ...new Set([
            ...programTest.programRegistrationAttributes.map(({ name }) => name),
            configuration.uniqueIdentifierField,
            'amount',
            GenericRegistrationAttributes.referenceId,
          ]),
        ].sort();
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
