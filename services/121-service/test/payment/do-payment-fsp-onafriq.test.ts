import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  doPayment,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/project.helper';
import {
  awaitChangeRegistrationStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Do payment to 1 PA with Fsp Onafriq', () => {
  const projectId = 1;
  const amount = 12327;
  const baseRegistrationOnafriq = {
    referenceId: '01dc9451-1273-484c-b2e8-ae21b51a96ab',
    projectFspConfigurationName: Fsps.onafriq,
    phoneNumber: '24311111111',
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier: 1,
    maxPayments: 6,
    firstName: 'Barbara',
    lastName: 'Floyd',
    gender: 'male',
    age: 25,
  };
  let registrationOnafriq;
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.onafriqProject, __filename);
    accessToken = await getAccessToken();
    registrationOnafriq = { ...baseRegistrationOnafriq };
  });

  it('should successfully pay-out', async () => {
    // Arrange
    await importRegistrations(projectId, [registrationOnafriq], accessToken);

    await awaitChangeRegistrationStatus({
      projectId,
      referenceIds: [registrationOnafriq.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationOnafriq.referenceId];

    // Act
    const doPaymentResponse = await doPayment({
      projectId,
      amount,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      projectId,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });

    // Assert
    const getTransactionsBody = await getTransactions({
      projectId,
      paymentId,
      registrationReferenceId: registrationOnafriq.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(getTransactionsBody.body[0].status).toBe(
      TransactionStatusEnum.success,
    );
    expect(getTransactionsBody.body[0].errorMessage).toBe(null);
  });

  it('should give error on the initial request based on magic phonenumber', async () => {
    // Arrange
    registrationOnafriq.phoneNumber = '24300000000'; // this magic number is configured in mock to return an error on request
    await importRegistrations(projectId, [registrationOnafriq], accessToken);
    await awaitChangeRegistrationStatus({
      projectId,
      referenceIds: [registrationOnafriq.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationOnafriq.referenceId];

    // Act
    const doPaymentResponse = await doPayment({
      projectId,
      amount,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      projectId,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
    });

    // Assert
    const getTransactionsBody = await getTransactions({
      projectId,
      paymentId,
      registrationReferenceId: registrationOnafriq.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(getTransactionsBody.body[0].status).toBe(
      TransactionStatusEnum.error,
    );
    expect(getTransactionsBody.body[0].errorMessage).toMatchSnapshot();
  });

  it('should give error via callback based on magic phonenumber', async () => {
    // Arrange
    registrationOnafriq.phoneNumber = '24300000002'; // this magic number is configured in mock to return an error on callback
    await importRegistrations(projectId, [registrationOnafriq], accessToken);
    await awaitChangeRegistrationStatus({
      projectId,
      referenceIds: [registrationOnafriq.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationOnafriq.referenceId];

    // Act
    const doPaymentResponse = await doPayment({
      projectId,
      amount,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    // wait for non-waiting transactions only, to make sure callback came in
    await waitForPaymentTransactionsToComplete({
      projectId,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });

    // Assert
    const getTransactionsBody = await getTransactions({
      projectId,
      paymentId,
      registrationReferenceId: registrationOnafriq.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(getTransactionsBody.body[0].status).toBe(
      TransactionStatusEnum.error,
    );
    expect(getTransactionsBody.body[0].errorMessage).toMatchSnapshot();
  });

  it('should not update transaction on a `duplicate thirdPartyTransId error` API response', async () => {
    // Arrange
    // NOTE 1: we use a magic phone number here that is configured in the mock to return a duplicate thirdPartyTransId error on request.
    // We use this as we cannot actually easily test a duplicate thirdPartyTransId error in the mock.
    registrationOnafriq.phoneNumber = '24300000001';
    await importRegistrations(projectId, [registrationOnafriq], accessToken);
    await awaitChangeRegistrationStatus({
      projectId,
      referenceIds: [registrationOnafriq.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationOnafriq.referenceId];

    // Act
    const doPaymentResponse = await doPayment({
      projectId,
      amount,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      projectId,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
    });

    // Assert
    // NOTE 2: We also assert that no callback comes in, so we must give some time for the callback to potentially come in, as the assertion is not valuable otherwise.
    await waitFor(1_000);

    const getTransactionsBody = await getTransactions({
      projectId,
      paymentId,
      registrationReferenceId: registrationOnafriq.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    // NOTE 3: this is the critical assertion, as in case of a duplicate thirdPartyTransId error, the transaction should not be updated to an error status.
    // This test is not following the real-life use case of making 2 calls, but does test the different handling in the code of this type of error.
    expect(getTransactionsBody.body[0].status).toBe(
      TransactionStatusEnum.waiting,
    );
  });
});
