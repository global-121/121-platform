import { HttpStatus } from '@nestjs/common';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdVisa,
  transferValueVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import {
  createAndStartPayment,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationOCW1,
  registrationOCW2,
  registrationOCW3,
  registrationOCW4,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Do payment with filter', () => {
  jest.retryTimes(1); // REFACTOR: these tests are often flaky, so we retry them once. It is better to fix the flakiness though!

  let accessToken: string;
  // Arrange
  const includedRefrenceIds = [
    registrationOCW1.referenceId,
    registrationOCW2.referenceId,
    registrationOCW3.referenceId,
  ];

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    await importRegistrations(
      programIdOCW,
      [registrationOCW1, registrationOCW2, registrationOCW3, registrationOCW4],
      accessToken,
    );

    await awaitChangeRegistrationStatus({
      programId: programIdVisa,
      referenceIds: includedRefrenceIds,
      status: RegistrationStatusEnum.included,
      accessToken,
    });
  });

  it('should only pay included people', async () => {
    // Act
    const doPaymentResponse = await createAndStartPayment({
      programId: programIdVisa,
      transferValue: transferValueVisa,
      referenceIds: [],
      accessToken,
    });

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds: includedRefrenceIds,
      accessToken,
      maxWaitTimeMs: 10_000,
    });
    const transactionsResponse = await getTransactions({
      programId: programIdVisa,
      paymentId: doPaymentResponse.body.id,
      registrationReferenceId: null,
      accessToken,
    });
    // Assert
    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      includedRefrenceIds.length,
    );

    // Also check if the right amount of transactions are created
    expect(transactionsResponse.body.length).toBe(includedRefrenceIds.length);
  });

  // This test is the same as the one above, but with a query filter parameter
  // This is done because the query filter parameter is used in the frontend when you are on the payment page
  // So in practice this query filter will very often be used
  it('should only pay included people with query filter included', async () => {
    // Act
    const doPaymentResponse = await createAndStartPayment({
      programId: programIdVisa,
      transferValue: transferValueVisa,
      referenceIds: [],
      accessToken,
      filter: { 'filter.status': '$in:included' },
    });

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds: includedRefrenceIds,
      accessToken,
      maxWaitTimeMs: 10_000,
    });
    const transactionsResponse = await getTransactions({
      programId: programIdVisa,
      paymentId: doPaymentResponse.body.id,
      registrationReferenceId: null,
      accessToken,
    });
    // Assert
    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      includedRefrenceIds.length,
    );
    expect(doPaymentResponse.body.totalFilterCount).toBe(
      includedRefrenceIds.length,
    );
    // Also check if the right amount of transactions are created
    expect(transactionsResponse.body.length).toBe(includedRefrenceIds.length);
  });

  it('should only pay included people with query filter referenceId', async () => {
    // Act
    const doPaymentResponse = await createAndStartPayment({
      programId: programIdVisa,
      transferValue: transferValueVisa,
      referenceIds: [],
      accessToken,
      filter: {
        'filter.status': '$in:included',
        'filter.referenceId': `$in:${registrationOCW1.referenceId}`,
      },
    });

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds: [registrationOCW1.referenceId],
      accessToken,
      maxWaitTimeMs: 10_000,
    });
    const transactionsResponse = await getTransactions({
      programId: programIdVisa,
      paymentId: doPaymentResponse.body.id,
      registrationReferenceId: null,
      accessToken,
    });
    // Assert
    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(1);
    expect(doPaymentResponse.body.totalFilterCount).toBe(1);
    // Also check if the right amount of transactions are created
    expect(transactionsResponse.body.length).toBe(1);
  });

  it('should only pay included people with a combination of filters', async () => {
    // Act
    const doPaymentResponse = await createAndStartPayment(
      {
        programId: programIdVisa,
        transferValue: transferValueVisa,
        referenceIds: [],
        accessToken,
        filter: {
          'filter.addressPostalCode': `$ilike:5`, // selects registrationOCW2 and registrationOCW3
          'filter.fullName': `$ilike:s`,
        },
      }, // This combination should only select registrationOCW3 that one is in both filters
    );

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds: [registrationOCW3.referenceId],
      accessToken,
      maxWaitTimeMs: 10_000,
    });
    const transactionsResponse = await getTransactions({
      programId: programIdVisa,
      paymentId: doPaymentResponse.body.id,
      registrationReferenceId: null,
      accessToken,
    });
    // Assert
    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(1);
    // REFACTOR: this test no longer involves the scenario where applicableCount<totalFilterCount, which might have originally been part of the intention. Change/add this test again in the future.
    expect(doPaymentResponse.body.totalFilterCount).toBe(1);
    // Also check if the right amount of transactions are created
    expect(transactionsResponse.body.length).toBe(1);
  });

  it('should only pay included people with a combination of filter and search', async () => {
    // Act
    const doPaymentResponse = await createAndStartPayment(
      {
        programId: programIdVisa,
        transferValue: transferValueVisa,
        referenceIds: [],
        accessToken,
        filter: {
          'filter.addressPostalCode': `$ilike:5`, // selects registrationOCW2 and registrationOCW3 and registrationOCW4
          search: `str`,
        },
      }, // This combination should only be applicable to registrationOCW3, registrationOCW4 is filtered but not applicable because it is not included
    );

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds: [registrationOCW3.referenceId],
      accessToken,
      maxWaitTimeMs: 10_000,
    });
    const transactionsResponse = await getTransactions({
      programId: programIdVisa,
      paymentId: doPaymentResponse.body.id,
      registrationReferenceId: null,
      accessToken,
    });
    // Assert
    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(1);
    expect(doPaymentResponse.body.totalFilterCount).toBe(2);
    // Also check if the right amount of transactions are created
    expect(transactionsResponse.body.length).toBe(1);
  });
});
