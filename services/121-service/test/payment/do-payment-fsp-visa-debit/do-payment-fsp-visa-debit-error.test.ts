import { FinancialServiceProviderConfigurationEnum } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { IntersolveVisa121ErrorText } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-121-error-text.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import {
  amountVisa,
  paymentNrVisa,
  programIdVisa,
  registrationVisa as registrationVisaDefault,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  deleteFspConfiguration,
  doPayment,
  getFspConfiguration,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangePaStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { HttpStatus } from '@nestjs/common';

describe('Do failing payment with FSP Visa Debit', () => {
  // Set WhatsApp-number for ALL tests in this suite only
  const registrationVisa = {
    ...registrationVisaDefault,
    whatsappPhoneNumber: registrationVisaDefault.phoneNumber,
  };

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  it('should fail pay-out Visa Debit (CREATE CUSTOMER ERROR)', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-create-customer';
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangePaStatus(
      programIdVisa,
      [registrationVisa.referenceId],
      RegistrationStatusEnum.included,
      accessToken,
    );
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await doPayment(
      programIdVisa,
      paymentNrVisa,
      amountVisa,
      paymentReferenceIds,
      accessToken,
    );

    await waitForPaymentTransactionsToComplete(
      programIdVisa,
      paymentReferenceIds,
      accessToken,
      3001,
      Object.values(StatusEnum),
    );

    // Assert
    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      registrationVisa.referenceId,
      accessToken,
    );

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
    await awaitChangePaStatus(
      programIdVisa,
      [registrationVisa.referenceId],
      RegistrationStatusEnum.included,
      accessToken,
    );
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await doPayment(
      programIdVisa,
      paymentNrVisa,
      amountVisa,
      paymentReferenceIds,
      accessToken,
    );

    await waitForPaymentTransactionsToComplete(
      programIdVisa,
      paymentReferenceIds,
      accessToken,
      3001,
      Object.values(StatusEnum),
    );

    // Assert
    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      registrationVisa.referenceId,
      accessToken,
    );

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
    await awaitChangePaStatus(
      programIdVisa,
      [registrationVisa.referenceId],
      RegistrationStatusEnum.included,
      accessToken,
    );
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await doPayment(
      programIdVisa,
      paymentNrVisa,
      amountVisa,
      paymentReferenceIds,
      accessToken,
    );

    await waitForPaymentTransactionsToComplete(
      programIdVisa,
      paymentReferenceIds,
      accessToken,
      3001,
      Object.values(StatusEnum),
    );

    // Assert
    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(transactionsResponse.text).toContain(
      IntersolveVisa121ErrorText.resgisterHolderError,
    );
  });

  it('should fail pay-out Visa Debit (CREATE DEBIT CARD ERROR)', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-create-debit-card';
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangePaStatus(
      programIdVisa,
      [registrationVisa.referenceId],
      RegistrationStatusEnum.included,
      accessToken,
    );
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await doPayment(
      programIdVisa,
      paymentNrVisa,
      amountVisa,
      paymentReferenceIds,
      accessToken,
    );

    await waitForPaymentTransactionsToComplete(
      programIdVisa,
      paymentReferenceIds,
      accessToken,
      3001,
      Object.values(StatusEnum),
    );

    // Assert
    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      registrationVisa.referenceId,
      accessToken,
    );

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
    await awaitChangePaStatus(
      programIdVisa,
      [registrationVisa.referenceId],
      RegistrationStatusEnum.included,
      accessToken,
    );
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    // do (successful) payment 1
    await doPayment(
      programIdVisa,
      paymentNrVisa,
      amountVisa,
      paymentReferenceIds,
      accessToken,
    );
    await waitForPaymentTransactionsToComplete(
      programIdVisa,
      paymentReferenceIds,
      accessToken,
      3001,
      Object.values(StatusEnum),
    );

    // do payment 2
    const doPaymentResponse = await doPayment(
      programIdVisa,
      paymentNrVisa + 1,
      amountVisa,
      paymentReferenceIds,
      accessToken,
    );
    await waitForPaymentTransactionsToComplete(
      programIdVisa,
      paymentReferenceIds,
      accessToken,
      3001,
      Object.values(StatusEnum),
      paymentNrVisa + 1,
    );

    // Assert
    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa + 1,
      registrationVisa.referenceId,
      accessToken,
    );

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(transactionsResponse.text).toContain(
      IntersolveVisa121ErrorText.getTokenError,
    );
  });

  it('should fail pay-out by visa debit if coverletterCode is not configured for the program', async () => {
    // Arrange
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangePaStatus(
      programIdVisa,
      [registrationVisa.referenceId],
      RegistrationStatusEnum.included,
      accessToken,
    );
    const paymentReferenceIds = [registrationVisa.referenceId];

    const fspConfig = await getFspConfiguration(programIdVisa, accessToken);
    const coverLetterCodeForFspConfigRecord = fspConfig.body.find(
      (fspConfig) =>
        fspConfig.name ===
        FinancialServiceProviderConfigurationEnum.coverLetterCode,
    );
    await deleteFspConfiguration(
      programIdVisa,
      coverLetterCodeForFspConfigRecord.id,
      accessToken,
    );

    // Act
    const doPaymentResponse = await doPayment(
      programIdVisa,
      paymentNrVisa,
      amountVisa,
      paymentReferenceIds,
      accessToken,
    );

    expect(doPaymentResponse.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should show a failed transaction if an idempotency key is duplicate', async () => {
    // This amount is configured in our mock service to fail with the same error as a duplicate idempotency key would create at intersolve
    const magicFailOperationReferenceAmount = 15.15;

    // Arrange
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangePaStatus(
      programIdVisa,
      [registrationVisa.referenceId],
      RegistrationStatusEnum.included,
      accessToken,
    );
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await doPayment(
      programIdVisa,
      paymentNrVisa,
      magicFailOperationReferenceAmount,
      paymentReferenceIds,
      accessToken,
    );
    await waitForPaymentTransactionsToComplete(
      programIdVisa,
      paymentReferenceIds,
      accessToken,
      3001,
      Object.values(StatusEnum),
      paymentNrVisa,
    );

    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    // Assert
    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(transactionsResponse.text).toContain(
      'Operation reference is already used.',
    );
  });
});
