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
  paymentNrVisa,
  programIdVisa,
  registrationVisa as registrationVisaDefault,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  doPayment,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { deleteProgramFspConfigurationProperty } from '@121-service/test/helpers/program-fsp-configuration.helper';
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
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      programId: programIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await doPayment({
      programId: programIdVisa,
      paymentNr: paymentNrVisa,
      amount: amountVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
    });

    // Assert
    const transactionsResponse = await getTransactions({
      programId: programIdVisa,
      paymentNr: paymentNrVisa,
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
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      programId: programIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await doPayment({
      programId: programIdVisa,
      paymentNr: paymentNrVisa,
      amount: amountVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
    });

    // Assert
    const transactionsResponse = await getTransactions({
      programId: programIdVisa,
      paymentNr: paymentNrVisa,
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
    const doPaymentResponse = await doPayment({
      programId: programIdVisa,
      paymentNr: paymentNrVisa,
      amount: amountVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
    });

    // Assert
    const transactionsResponse = await getTransactions({
      programId: programIdVisa,
      paymentNr: paymentNrVisa,
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
    const doPaymentResponse = await doPayment({
      programId: programIdVisa,
      paymentNr: paymentNrVisa,
      amount: amountVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
    });

    // Assert
    const transactionsResponse = await getTransactions({
      programId: programIdVisa,
      paymentNr: paymentNrVisa,
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
    await doPayment({
      programId: programIdVisa,
      paymentNr: paymentNrVisa,
      amount: amountVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
    });

    // do payment 2
    const doPaymentResponse = await doPayment({
      programId: programIdVisa,
      paymentNr: paymentNrVisa + 1,
      amount: amountVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
      payment: paymentNrVisa + 1,
    });

    // Assert
    const transactionsResponse = await getTransactions({
      programId: programIdVisa,
      paymentNr: paymentNrVisa + 1,
      registrationReferenceId: registrationVisa.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
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
    const doPaymentResponse = await doPayment({
      programId: programIdVisa,
      paymentNr: paymentNrVisa,
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
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      programId: programIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await doPayment({
      programId: programIdVisa,
      paymentNr: paymentNrVisa,
      amount: magicFailOperationReferenceAmount,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
      payment: paymentNrVisa,
    });

    const transactionsResponse = await getTransactions({
      programId: programIdVisa,
      paymentNr: paymentNrVisa,
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
