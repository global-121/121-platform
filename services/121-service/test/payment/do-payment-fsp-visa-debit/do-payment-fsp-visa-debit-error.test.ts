import { HttpStatus } from '@nestjs/common';

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { IntersolveVisa121ErrorText } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-121-error-text.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  amountVisa,
  projectIdVisa,
  registrationVisa as registrationVisaDefault,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  doPayment,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/project.helper';
import { deleteProjectFspConfigurationProperty } from '@121-service/test/helpers/project-fsp-configuration.helper';
import {
  awaitChangeRegistrationStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Do failing payment with FSP Visa Debit', () => {
  let registrationVisa;

  let accessToken: string;

  beforeEach(async () => {
    // This should be redefined in each test, so that changed values are not carried over to the next test
    registrationVisa = {
      ...registrationVisaDefault,
      whatsappPhoneNumber: registrationVisaDefault.phoneNumber, // Set WhatsApp-number for ALL tests in this suite only
    };
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  it('should fail pay-out Visa Debit (CREATE CUSTOMER ERROR)', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-create-customer';
    await importRegistrations(projectIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      projectId: projectIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await doPayment({
      projectId: projectIdVisa,
      amount: amountVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      projectId: projectIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
    });

    // Assert
    const transactionsResponse = await getTransactions({
      projectId: projectIdVisa,
      paymentId,
      registrationReferenceId: registrationVisa.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(transactionsResponse.text).toContain(
      IntersolveVisa121ErrorText.createCustomerError,
    );
  });

  it('should fail pay-out Visa Debit (CREATE WALLET ERROR)', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-create-wallet';
    await importRegistrations(projectIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      projectId: projectIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await doPayment({
      projectId: projectIdVisa,
      amount: amountVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      projectId: projectIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
    });

    // Assert
    const transactionsResponse = await getTransactions({
      projectId: projectIdVisa,
      paymentId,
      registrationReferenceId: registrationVisa.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(transactionsResponse.text).toContain(
      IntersolveVisa121ErrorText.issueTokenError,
    );
  });

  it('should fail pay-out Visa Debit (LINK CUSTOMER ERROR)', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-link-customer-wallet';
    await importRegistrations(projectIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      projectId: projectIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await doPayment({
      projectId: projectIdVisa,
      amount: amountVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      projectId: projectIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
    });

    // Assert
    const transactionsResponse = await getTransactions({
      projectId: projectIdVisa,
      paymentId,
      registrationReferenceId: registrationVisa.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(transactionsResponse.text).toContain(
      IntersolveVisa121ErrorText.registerHolderError,
    );
  });

  it('should fail pay-out Visa Debit (CREATE DEBIT CARD ERROR)', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-create-debit-card';
    await importRegistrations(projectIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      projectId: projectIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await doPayment({
      projectId: projectIdVisa,
      amount: amountVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      projectId: projectIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
    });

    // Assert
    const transactionsResponse = await getTransactions({
      projectId: projectIdVisa,
      paymentId,
      registrationReferenceId: registrationVisa.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(transactionsResponse.text).toContain(
      IntersolveVisa121ErrorText.createPhysicalCardError,
    );
  });

  it('should fail pay-out Visa Debit (CALCULATE TOPUP AMOUNT ERROR)', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-get-wallet';
    await importRegistrations(projectIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      projectId: projectIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    // do (successful) payment 1
    const doPaymentResponse1 = await doPayment({
      projectId: projectIdVisa,
      amount: amountVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId1 = doPaymentResponse1.body.id;
    await waitForPaymentTransactionsToComplete({
      projectId: projectIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
      paymentId: paymentId1,
    });

    // do payment 2
    const doPaymentResponse2 = await doPayment({
      projectId: projectIdVisa,
      amount: amountVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId2 = doPaymentResponse2.body.id;
    await waitForPaymentTransactionsToComplete({
      projectId: projectIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
      paymentId: paymentId2,
    });

    // Assert
    const transactionsResponse = await getTransactions({
      projectId: projectIdVisa,
      paymentId: paymentId2,
      registrationReferenceId: registrationVisa.referenceId,
      accessToken,
    });

    expect(doPaymentResponse2.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse2.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(transactionsResponse.text).toContain(
      IntersolveVisa121ErrorText.getTokenError,
    );
  });

  it('should fail pay-out by visa debit if coverletterCode or fundingToken is not configured for the project', async () => {
    // Arrange
    await importRegistrations(projectIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      projectId: projectIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    await deleteProjectFspConfigurationProperty({
      projectId: projectIdVisa,
      configName: Fsps.intersolveVisa,
      propertyName: FspConfigurationProperties.coverLetterCode,
      accessToken,
    });
    await deleteProjectFspConfigurationProperty({
      projectId: projectIdVisa,
      configName: Fsps.intersolveVisa,
      propertyName: FspConfigurationProperties.fundingTokenCode,
      accessToken,
    });

    // Act
    const doPaymentResponse = await doPayment({
      projectId: projectIdVisa,
      amount: amountVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.BAD_REQUEST);
    // Check if both properties are mentioned in the error message
    expect(doPaymentResponse.body.message).toContain(
      FspConfigurationProperties.coverLetterCode,
    );
    expect(doPaymentResponse.body.message).toContain(
      FspConfigurationProperties.fundingTokenCode,
    );
  });

  it('should show a failed transaction if an idempotency key is duplicate', async () => {
    // This amount is configured in our mock service to fail with the same error as a duplicate idempotency key would create at intersolve
    const magicFailOperationReferenceAmount = 15.15;

    // Arrange
    await importRegistrations(projectIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      projectId: projectIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await doPayment({
      projectId: projectIdVisa,
      amount: magicFailOperationReferenceAmount,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;
    await waitForPaymentTransactionsToComplete({
      projectId: projectIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
      paymentId,
    });

    const transactionsResponse = await getTransactions({
      projectId: projectIdVisa,
      paymentId,
      registrationReferenceId: registrationVisa.referenceId,
      accessToken,
    });

    // Assert
    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(transactionsResponse.text).toContain(
      'Operation reference is already used.',
    );
  });
});
