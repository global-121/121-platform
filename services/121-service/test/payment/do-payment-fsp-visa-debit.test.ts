import { HttpStatus } from '@nestjs/common';
import {
  amountVisa,
  paymentNrVisa,
  programIdVisa,
  registrationVisa as registrationVisaDefault,
} from '../../seed-data/mock/visa-card.data';
import { FspConfigurationEnum } from '../../src/fsp/enum/fsp-name.enum';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { StatusEnum } from '../../src/shared/enum/status.enum';
import { waitFor } from '../../src/utils/waitFor.helper';
import { adminOwnerDto } from '../fixtures/user-owner';
import {
  deleteFspConfiguration,
  doPayment,
  getFspConfiguration,
  getTransactions,
  retryPayment,
  waitForPaymentTransactionsToComplete,
} from '../helpers/program.helper';
import {
  awaitChangePaStatus,
  importRegistrations,
  issueNewVisaCard,
  updateRegistration,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import {
  registrationOCW2,
  registrationOCW3,
  registrationOCW4,
} from '../registrations/pagination/pagination-data';

describe('Do payment to 1 PA', () => {
  // Set WhatsApp-number for ALL tests in this suite only
  const registrationVisa = {
    ...registrationVisaDefault,
    whatsappPhoneNumber: registrationVisaDefault.phoneNumber,
  };

  describe('with FSP: Intersolve Visa Debit', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.nlrcMultiple);
      accessToken = await getAccessToken();
      await waitFor(2_000);
    });

    it('should succesfully pay-out Visa Debit', async () => {
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
      expect(transactionsResponse.text).toContain(StatusEnum.success);
      expect(transactionsResponse.body[0].user).toMatchObject(adminOwnerDto);
    });

    it('should fail pay-out Visa Debit (CREATE CUSTOMER ERROR)', async () => {
      // Arrange
      registrationVisa.lastName = 'mock-fail-create-customer';
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
      expect(transactionsResponse.text).toContain('CREATE CUSTOMER ERROR');
    });

    it('should fail pay-out Visa Debit (CREATE WALLET ERROR)', async () => {
      // Arrange
      registrationVisa.lastName = 'mock-fail-create-wallet';
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
      expect(transactionsResponse.text).toContain('CREATE WALLET ERROR');
    });

    it('should fail pay-out Visa Debit (LINK CUSTOMER ERROR)', async () => {
      // Arrange
      registrationVisa.lastName = 'mock-fail-link-customer-wallet';
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
      expect(transactionsResponse.text).toContain('LINK CUSTOMER ERROR');
    });

    it('should fail pay-out Visa Debit (CREATE DEBIT CARD ERROR)', async () => {
      // Arrange
      registrationVisa.lastName = 'mock-fail-create-debit-card';
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
      expect(transactionsResponse.text).toContain('CREATE DEBIT CARD ERROR');
    });

    it('should fail pay-out Visa Debit (CALCULATE TOPUP AMOUNT ERROR)', async () => {
      // Arrange
      registrationVisa.lastName = 'mock-fail-get-wallet';
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
        'CALCULATE TOPUP AMOUNT ERROR',
      );
    });

    it('should successfully load balance Visa Debit', async () => {
      // Arrange
      registrationVisa.lastName = 'succeed';
      await importRegistrations(programIdVisa, [registrationVisa], accessToken);
      await awaitChangePaStatus(
        programIdVisa,
        [registrationVisa.referenceId],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [registrationVisa.referenceId];

      // Act
      // do 1st payment
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
        paymentNrVisa,
      );

      // do 2nd payment
      const doSecondPaymentResponse = await doPayment(
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

      expect(doSecondPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doSecondPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(transactionsResponse.text).toContain(StatusEnum.success);
    });

    it('should successfully retry pay-out after create customer error', async () => {
      // Arrange
      registrationVisa.lastName = 'mock-fail-create-customer';
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
        paymentNrVisa,
      );

      // update PA
      await updateRegistration(
        programIdVisa,
        registrationVisa.referenceId,
        { lastName: 'succeed' },
        'automated test',
        accessToken,
      );

      // retry payment
      await retryPayment(programIdVisa, paymentNrVisa, accessToken);
      await waitFor(2_000);

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
      expect(transactionsResponse.text).toContain(StatusEnum.success);
    });

    it('should not multiply again on retry', async () => {
      // Arrange
      registrationVisa.lastName = 'mock-fail-create-customer';
      registrationVisa.paymentAmountMultiplier = 3;
      await importRegistrations(programIdVisa, [registrationVisa], accessToken);
      await awaitChangePaStatus(
        programIdVisa,
        [registrationVisa.referenceId],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [registrationVisa.referenceId];

      // Act
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
        paymentNrVisa,
      );

      // update PA
      await updateRegistration(
        programIdVisa,
        registrationVisa.referenceId,
        { lastName: 'succeed' },
        'automated test',
        accessToken,
      );

      // retry payment
      await retryPayment(programIdVisa, paymentNrVisa, accessToken);
      await waitFor(2_000);

      // Assert
      const transactionsResponse = await getTransactions(
        programIdVisa,
        paymentNrVisa,
        registrationVisa.referenceId,
        accessToken,
      );

      expect(transactionsResponse.body[0].amount).toBe(
        amountVisa * registrationVisa.paymentAmountMultiplier,
      );
      expect(transactionsResponse.text).toContain(StatusEnum.success);
    });

    it('should payout different amounts based on current balance and spend', async () => {
      // Arrange
      const testPaymentNumber = 2;
      registrationVisa.lastName = 'mock-current-balance-13000-mock-spent-1000';
      registrationVisa.paymentAmountMultiplier = 3;

      registrationOCW2.lastName = 'mock-current-balance-14000-mock-spent-1000';
      registrationOCW2.paymentAmountMultiplier = 3;

      registrationOCW3.lastName = 'success';
      registrationOCW3.paymentAmountMultiplier = 3;

      registrationOCW4.lastName = 'mock-current-balance-0-mock-spent-6000';
      registrationOCW4.paymentAmountMultiplier = 3;

      const registrations = [
        registrationVisa,
        registrationOCW2,
        registrationOCW3,
        registrationOCW4,
      ];

      const referenceIds = registrations.map((r) => r.referenceId);

      await importRegistrations(programIdVisa, registrations, accessToken);
      await awaitChangePaStatus(
        programIdVisa,
        referenceIds,
        RegistrationStatusEnum.included,
        accessToken,
      );

      // Act
      // do 1st payment
      await doPayment(
        programIdVisa,
        paymentNrVisa,
        amountVisa,
        referenceIds,
        accessToken,
      );

      await waitForPaymentTransactionsToComplete(
        programIdVisa,
        referenceIds,
        accessToken,
        6_000,
        Object.values(StatusEnum),
        paymentNrVisa,
      );

      // Reissue card so both cards have a spend of 6000
      await issueNewVisaCard(
        programIdVisa,
        registrationOCW4.referenceId,
        accessToken,
      );
      await waitFor(2_000);

      await doPayment(
        programIdVisa,
        testPaymentNumber,
        amountVisa,
        referenceIds,
        accessToken,
      );

      await waitForPaymentTransactionsToComplete(
        programIdVisa,
        referenceIds,
        accessToken,
        6_000,
        Object.values(StatusEnum),
        testPaymentNumber,
      );

      // Assert
      const transactionsResponse1 = await getTransactions(
        programIdVisa,
        testPaymentNumber,
        registrationVisa.referenceId,
        accessToken,
      );
      const transactionsResponse2 = await getTransactions(
        programIdVisa,
        testPaymentNumber,
        registrationOCW2.referenceId,
        accessToken,
      );
      const transactionsResponse3 = await getTransactions(
        programIdVisa,
        testPaymentNumber,
        registrationOCW3.referenceId,
        accessToken,
      );
      const transactionsResponse4 = await getTransactions(
        programIdVisa,
        testPaymentNumber,
        registrationOCW4.referenceId,
        accessToken,
      );

      expect(transactionsResponse1.body[0].amount).toBe(
        150 - 13000 / 100 - 1000 / 100, // = 10
      );
      expect(transactionsResponse1.text).toContain(StatusEnum.success);

      expect(transactionsResponse2.body[0].amount).toBe(
        150 - 14000 / 100 - 1000 / 100, // = 0 : A transaction of 0 is created
      );
      expect(transactionsResponse2.text).toContain(StatusEnum.success);

      // should be able to payout the full amount
      expect(transactionsResponse3.body[0].amount).toBe(
        amountVisa * registrationOCW3.paymentAmountMultiplier,
      );
      expect(transactionsResponse3.text).toContain(StatusEnum.success);

      // Kyc requirement
      expect(transactionsResponse4.body[0].amount).toBe(
        150 - (6000 * 2) / 100 - 0, // = 30
      );
      expect(transactionsResponse4.text).toContain(StatusEnum.success);
    });

    it('should faild pay-out by visa debit if coverletterCode is not configured for the program', async () => {
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
        (fspConfig) => fspConfig.name === FspConfigurationEnum.coverLetterCode,
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
        "CREATE DEBIT CARD ERROR: 400 - No coverLetterCode found for financial service provider under program 3. Please update the program's financial service provider cofinguration.",
      );
    });
  });

  // TODO: We skipped testing successful retry after:
  // 1. create wallet error
  // 2. link customer error
  // 3. create debit card error
  // 4. load balance error
  // because our current mock implementation does not support it yet
});
