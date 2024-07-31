import { FinancialServiceProviderConfigurationEnum } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { IntersolveVisa121ErrorText } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-121-error-text.enum';
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
  seedIncludedRegistrations,
  seedPaidRegistrations,
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

  // An amount that is above the kyc limit
  const amount160 = 160;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  it('should fail pay-out Visa Debit (CREATE CUSTOMER ERROR)', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-create-customer';
    const doPaymentResponse = await seedPaidRegistrations(
      [registrationVisa],
      programIdVisa,
    );

    // Assert
    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(1);
    expect(transactionsResponse.text).toContain(
      IntersolveVisa121ErrorText.createCustomerError,
    );
  });

  it('should fail pay-out Visa Debit (CREATE WALLET ERROR)', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-create-wallet';
    const doPaymentResponse = await seedPaidRegistrations(
      [registrationVisa],
      programIdVisa,
    );

    // Assert
    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(1);
    expect(transactionsResponse.text).toContain(
      IntersolveVisa121ErrorText.issueTokenError,
    );
  });

  it('should fail pay-out Visa Debit (LINK CUSTOMER ERROR)', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-link-customer-wallet';
    const doPaymentResponse = await seedPaidRegistrations(
      [registrationVisa],
      programIdVisa,
    );

    // Assert
    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(1);
    expect(transactionsResponse.text).toContain(
      IntersolveVisa121ErrorText.resgisterHolderError,
    );
  });

  it('should fail pay-out Visa Debit (CREATE DEBIT CARD ERROR)', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-create-debit-card';
    const doPaymentResponse = await seedPaidRegistrations(
      [registrationVisa],
      programIdVisa,
    );

    // Assert
    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(1);
    expect(transactionsResponse.text).toContain(
      IntersolveVisa121ErrorText.createPhysicalCardError,
    );
  });

  it('should fail pay-out Visa Debit (LINK CHILD AND PARENT WALLET)', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-link-token';
    const doPaymentResponse = await seedPaidRegistrations(
      [registrationVisa],
      programIdVisa,
    );

    // Assert
    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(1);
    expect(transactionsResponse.text).toContain(
      IntersolveVisa121ErrorText.linkTokenError,
    );
  });

  it('should fail pay-out Visa Debit (CALCULATE TOPUP AMOUNT ERROR)', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-get-wallet';

    const paymentReferenceIds = [registrationVisa.referenceId];
    await seedPaidRegistrations([registrationVisa], programIdVisa);

    // do payment 2
    const doPaymentResponse = await doPayment(
      programIdVisa,
      paymentNrVisa + 1,
      amount160,
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
    expect(transactionsResponse.text).toContain(
      IntersolveVisa121ErrorText.calculatingTransferAmount,
    );
    // Since the error now occured in the calculation of the top-up amount, the amount should be 160 (which is higher than the kyc limit)
    expect(transactionsResponse.body[0].amount).toBe(amount160);
  });

  it('should fail pay-out by visa debit if coverletterCode is not configured for the program', async () => {
    // Arrange
    await seedIncludedRegistrations(
      [registrationVisa],
      programIdVisa,
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

  it('should fail pay-out Visa Debit (phonenumber not set)', async () => {
    // Arrange
    const programIdPv = 2;
    const untypedRegistrationVisa = registrationVisa as any;
    untypedRegistrationVisa.phoneNumber = undefined;

    const doPaymentResponse = await seedPaidRegistrations(
      [untypedRegistrationVisa],
      programIdPv,
    );

    // Assert
    const transactionsResponse = await getTransactions(
      programIdPv,
      paymentNrVisa,
      untypedRegistrationVisa.referenceId,
      accessToken,
    );

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(1);
    expect(transactionsResponse.text).toContain('phoneNumber');
  });
});
