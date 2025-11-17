import { HttpStatus } from '@nestjs/common';

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { IntersolveVisa121ErrorText } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-121-error-text.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdVisa,
  registrationVisa as registrationVisaDefault,
  transferValueVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  createAndStartPayment,
  getTransactionsByPaymentIdPaginated,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { deleteProgramFspConfigurationProperty } from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  awaitChangeRegistrationStatus,
  getTransactionEventDescriptions,
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
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      programId: programIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await createAndStartPayment({
      programId: programIdVisa,
      transferValue: transferValueVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });

    // Assert
    const transactionsResponse = await getTransactionsByPaymentIdPaginated({
      programId: programIdVisa,
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
    const transactions = transactionsResponse.body.data;

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId: programIdVisa,
      transactionId: transactions[0].id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual([
      TransactionEventDescription.created,
      TransactionEventDescription.approval,
      TransactionEventDescription.initiated,
      TransactionEventDescription.visaPaymentRequested,
    ]);
  });

  it('should fail pay-out Visa Debit (CREATE WALLET ERROR)', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-create-wallet';
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      programId: programIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await createAndStartPayment({
      programId: programIdVisa,
      transferValue: transferValueVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });

    // Assert
    const transactionsResponse = await getTransactionsByPaymentIdPaginated({
      programId: programIdVisa,
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
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      programId: programIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await createAndStartPayment({
      programId: programIdVisa,
      transferValue: transferValueVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });

    // Assert
    const transactionsResponse = await getTransactionsByPaymentIdPaginated({
      programId: programIdVisa,
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
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      programId: programIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await createAndStartPayment({
      programId: programIdVisa,
      transferValue: transferValueVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });

    // Assert
    const transactionsResponse = await getTransactionsByPaymentIdPaginated({
      programId: programIdVisa,
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
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      programId: programIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    // do (successful) payment 1
    const doPaymentResponse1 = await createAndStartPayment({
      programId: programIdVisa,
      transferValue: transferValueVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId1 = doPaymentResponse1.body.id;
    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
      paymentId: paymentId1,
    });

    // do payment 2
    const doPaymentResponse2 = await createAndStartPayment({
      programId: programIdVisa,
      transferValue: transferValueVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId2 = doPaymentResponse2.body.id;
    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
      paymentId: paymentId2,
    });

    // Assert
    const transactionsResponse = await getTransactionsByPaymentIdPaginated({
      programId: programIdVisa,
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

  it('should fail pay-out by visa debit if coverletterCode or fundingToken is not configured for the program', async () => {
    // Arrange
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      programId: programIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    await deleteProgramFspConfigurationProperty({
      programId: programIdVisa,
      configName: Fsps.intersolveVisa,
      propertyName: FspConfigurationProperties.coverLetterCode,
      accessToken,
    });
    await deleteProgramFspConfigurationProperty({
      programId: programIdVisa,
      configName: Fsps.intersolveVisa,
      propertyName: FspConfigurationProperties.fundingTokenCode,
      accessToken,
    });

    // Act
    const doPaymentResponse = await createAndStartPayment({
      programId: programIdVisa,
      transferValue: transferValueVisa,
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
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      programId: programIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await createAndStartPayment({
      programId: programIdVisa,
      transferValue: magicFailOperationReferenceAmount,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;
    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
      paymentId,
    });

    const transactionsResponse = await getTransactionsByPaymentIdPaginated({
      programId: programIdVisa,
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
