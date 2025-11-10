import { HttpStatus } from '@nestjs/common';

import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getTransactions,
  patchProgram,
  postProgramRegistrationAttribute,
} from '@121-service/test/helpers/program.helper';
import {
  importRegistrations,
  searchRegistrationByReferenceId,
  seedPaidRegistrations,
  seedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  programIdWesteros,
  registrationPV5,
  registrationWesteros1,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Set/calculate payment amount multiplier', () => {
  let accessToken: string;

  let registrationWesterosCopy: any;

  beforeEach(async () => {
    accessToken = await getAccessToken();
  });

  describe('Payment amount multiplier formula is set', () => {
    beforeEach(async () => {
      await resetDB(SeedScript.testMultiple, __filename);

      registrationWesterosCopy = { ...registrationWesteros1 };
      registrationWesterosCopy.dothraki = 0; // default value

      await postProgramRegistrationAttribute({
        programId: programIdWesteros,
        programRegistrationAttribute: {
          name: 'dothraki',
          label: { en: 'Dothraki' },
          isRequired: true,
          type: RegistrationAttributeTypes.numeric,
        },
        accessToken,
      });
    });

    it('should automatically calculate payment amount based on formula (addition)', async () => {
      // Arrange

      const nrOfDragons = 3; // We are using half a dragon here to ensure decimal calculations also work
      const transferValue = 10;
      const nrOfDothraki = 2;

      registrationWesterosCopy.dragon = nrOfDragons;
      registrationWesterosCopy.dothraki = nrOfDothraki;

      await patchProgram(
        programIdWesteros,
        {
          paymentAmountMultiplierFormula: '${dragon} + ${dothraki}',
        },
        accessToken,
      );

      // Act
      const paymentId = await seedPaidRegistrations(
        [registrationWesterosCopy],
        programIdWesteros,
        transferValue,
      );
      const searchRegistrationResponse = await searchRegistrationByReferenceId(
        registrationWesterosCopy.referenceId,
        programIdWesteros,
        accessToken,
      );
      const importedRegistration = searchRegistrationResponse.body.data[0];

      const transactionsResponse = await getTransactions({
        programId: programIdWesteros,
        paymentId,
        registrationReferenceId: importedRegistration.referenceId,

        accessToken,
      });
      const transaction = transactionsResponse.body[0];

      // Assert
      expect(importedRegistration.paymentAmountMultiplier).toBe(
        nrOfDragons + nrOfDothraki,
      );
      expect(transaction.amount).toBe(
        transferValue * (nrOfDragons + nrOfDothraki),
      );
    });

    it('should succesfully payment amount multiplier based on different formula', async () => {
      // Arrange

      const nrOfDragons = 2;
      const nrOfDothraki = 4;

      registrationWesterosCopy.dragon = nrOfDragons;
      registrationWesterosCopy.dothraki = nrOfDothraki;

      const formulateAndResults: { formula: string; expectedResult: number }[] =
        [
          {
            formula: '${dragon} - ${dothraki}',
            expectedResult: nrOfDragons - nrOfDothraki,
          },
          {
            formula: '${dragon} * ${dothraki}',
            expectedResult: nrOfDragons * nrOfDothraki,
          },
          {
            formula: '${dothraki} / ${dragon}',
            expectedResult: nrOfDothraki / nrOfDragons,
          },
          {
            formula: 'if(${dragon} < 3, 100, 200)',
            expectedResult: 100, // since nrOfDragons is 2
          },
          {
            formula: 'round(2.5)', // ROUND DOES NOT WORK WITH PLACES only to whole numbers
            expectedResult: 3, // since 2.5 rounded is 3
          },
          {
            formula: "if(${house} != 'stark', 55, 66)",
            expectedResult: 66,
          },

          {
            formula: "if(${house} = 'stark', 77, 88)",
            expectedResult: 77,
          },
          {
            formula: 'if(${dragon} = 2, 9, 10)',
            expectedResult: 9,
          },
          {
            formula: 'if(${dothraki} != 4, 19, 20)',
            expectedResult: 20,
          },
          {
            formula: 'if(${dothraki} < 5, 11, 22)',
            expectedResult: 11,
          },
          {
            formula: 'if(${dragon} <= 2, 33, 44)',
            expectedResult: 33,
          },
          {
            formula: 'if(${dothraki} > 3, 77, 88)',
            expectedResult: 77,
          },
          {
            formula: 'if(${dragon} >= 2, 99, 111)',
            expectedResult: 99,
          },
          {
            formula: 'if(${dragon} > 1 and ${dothraki} > 100, 123, 456)',
            expectedResult: 456,
          },
          {
            formula: 'if(${dragon} > 1 and ${dothraki} > 1, 123, 456)',
            expectedResult: 123,
          },
          {
            formula: 'if(${dragon} > 100 or ${dothraki} > 100, 321, 654)',
            expectedResult: 654,
          },
          {
            formula: 'if(${dragon} > 1 or ${dothraki} > 1, 321, 654)',
            expectedResult: 321,
          },
          {
            formula:
              'if(${dragon} > 1 or ${dothraki} > 1, ${dragon} + ${dothraki}, 654)',
            expectedResult: nrOfDothraki + nrOfDragons,
          },
          {
            formula: 'if( 2 > 1 , if(3 > 2, 111, 222), 333)',
            expectedResult: 111,
          },
        ];

      let i = 0;
      for (const formulateAndResult of formulateAndResults) {
        await patchProgram(
          programIdWesteros,
          {
            paymentAmountMultiplierFormula: formulateAndResult.formula,
          },
          accessToken,
        );

        // Act

        // esnure we can easily identify the registration based on referenceId which is now the same as the formula
        const registrationUniqueRefId = {
          ...registrationWesterosCopy,
          referenceId: `reference-${i}`,
        };

        await seedRegistrations([registrationUniqueRefId], programIdWesteros);
        const searchRegistrationResponse =
          await searchRegistrationByReferenceId(
            registrationUniqueRefId.referenceId,
            programIdWesteros,
            accessToken,
          );

        // Assert
        const importedRegistration = searchRegistrationResponse.body.data[0];
        expect(importedRegistration.paymentAmountMultiplier).toBe(
          formulateAndResult.expectedResult,
        );
        i++;
      }
    });

    it('should error if paymentAmountMultiplier is set while program has a formula', async () => {
      await resetDB(SeedScript.testMultiple, __filename);
      // Arrange
      const registrationWesterosCopy = {
        ...registrationWesteros1,
        ...{ paymentAmountMultiplier: 3 },
      };

      // Act
      const responseImport = await importRegistrations(
        programIdWesteros,
        [registrationWesterosCopy],
        accessToken,
      );

      const searchRegistrationResponse = await searchRegistrationByReferenceId(
        registrationWesterosCopy.referenceId,
        programIdWesteros,
        accessToken,
      );
      // Assert
      expect(responseImport.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(searchRegistrationResponse.body).toMatchSnapshot();
    });
  });

  describe('Payment amount multiplier formula is not set', () => {
    it('should set paymentAmountMultiplier to 1 and paymentAmountMultiplier in import is not set', async () => {
      // Arrange
      await resetDB(SeedScript.nlrcMultiple, __filename);
      const registrationPvCopy = {
        ...registrationPV5,
      };

      // Act
      const responseImport = await importRegistrations(
        programIdPV,
        [registrationPvCopy],
        accessToken,
      );

      const searchRegistrationResponse = await searchRegistrationByReferenceId(
        registrationPvCopy.referenceId,
        programIdPV,
        accessToken,
      );
      const importedRegistration = searchRegistrationResponse.body.data[0];
      // Assert
      expect(responseImport.statusCode).toBe(HttpStatus.CREATED);
      expect(searchRegistrationResponse.body.data.length).toBe(1);
      expect(importedRegistration.paymentAmountMultiplier).toBe(1);
    });

    it('should set paymentAmountMultiplier based paymentAmountMultiplier', async () => {
      // Arrange
      await resetDB(SeedScript.nlrcMultiple, __filename);
      const paymentAmountMultiplier = 3;
      const registrationPvCopy = {
        ...registrationPV5,
        ...{ paymentAmountMultiplier },
      };
      // Act
      const responseImport = await importRegistrations(
        programIdPV,
        [registrationPvCopy],
        accessToken,
      );

      const searchRegistrationResponse = await searchRegistrationByReferenceId(
        registrationPvCopy.referenceId,
        programIdPV,
        accessToken,
      );
      const importedRegistration = searchRegistrationResponse.body.data[0];
      // Assert
      expect(responseImport.statusCode).toBe(HttpStatus.CREATED);
      expect(importedRegistration.paymentAmountMultiplier).toBe(
        paymentAmountMultiplier,
      );
    });
  });
});
