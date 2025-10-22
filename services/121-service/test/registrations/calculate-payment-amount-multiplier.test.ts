import { HttpStatus } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getTransactions } from '@121-service/test/helpers/program.helper';
import {
  doPaymentAndWaitForCompletion,
  importRegistrations,
  searchRegistrationByReferenceId,
  seedIncludedRegistrations,
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

  beforeEach(async () => {
    accessToken = await getAccessToken();
  });

  it('should automatically calculate payment amount based on formula', async () => {
    // Arrange
    await resetDB(SeedScript.testMultiple, __filename);
    const nrOfDragons = 2.5; // We are using half a dragon here to ensure decimal calculations also work
    const transferValue = 10;
    const registrationWesterosCopy = { ...registrationWesteros1 };
    registrationWesterosCopy.dragon = nrOfDragons;

    // Act
    await seedIncludedRegistrations(
      [registrationWesterosCopy],
      programIdWesteros,
      accessToken,
    );
    const searchRegistrationResponse = await searchRegistrationByReferenceId(
      registrationWesterosCopy.referenceId,
      programIdWesteros,
      accessToken,
    );
    const importedRegistration = searchRegistrationResponse.body.data[0];

    const paymentId = await doPaymentAndWaitForCompletion({
      programId: programIdWesteros,
      referenceIds: [importedRegistration.referenceId],
      transferValue,
      accessToken,
      completeStatusses: Object.values(TransactionStatusEnum),
    });

    const transactionsResponse = await getTransactions({
      programId: programIdWesteros,
      paymentId,
      registrationReferenceId: importedRegistration.referenceId,

      accessToken,
    });
    const transaction = transactionsResponse.body[0];
    // Assert

    expect(importedRegistration.paymentAmountMultiplier).toBe(nrOfDragons + 1);
    expect(transaction.amount).toBe(transferValue * (nrOfDragons + 1));
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

  it('should set paymentAmountMultiplier to 1 if program has no formula and paymentAmountMultiplier in import is not set', async () => {
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

  it('should set paymentAmountMultiplier based paymentAmountMultiplier if program has no formula', async () => {
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
