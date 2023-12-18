import { HttpStatus } from '@nestjs/common';
import {
  amountVisa,
  paymentNrVisa,
  programIdVisa,
  referenceIdVisa,
  registrationVisa,
} from '../../seed-data/mock/visa-card.data';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.enum';
import { waitFor } from '../../src/utils/waitFor.helper';
import {
  changePhase,
  doPayment,
  getTransactions,
  retryPayment,
} from '../helpers/program.helper';
import {
  awaitChangePaStatus,
  importRegistrations,
  updateRegistration,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';

describe('Do payment to 1 PA', () => {
  registrationVisa.whatsappPhoneNumber = '14155238887';

  describe('with FSP: Intersolve Visa Debit', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.nlrcMultiple);
      accessToken = await getAccessToken();
      await waitFor(2_000);

      await changePhase(
        programIdVisa,
        ProgramPhase.registrationValidation,
        accessToken,
      );
      await changePhase(programIdVisa, ProgramPhase.inclusion, accessToken);
      await changePhase(programIdVisa, ProgramPhase.payment, accessToken);
    });

    it('should succesfully pay-out Visa Debit', async () => {
      // Arrange
      await importRegistrations(programIdVisa, [registrationVisa], accessToken);
      await awaitChangePaStatus(
        programIdVisa,
        [referenceIdVisa],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [referenceIdVisa];
      // Act
      const doPaymentResponse = await doPayment(
        programIdVisa,
        paymentNrVisa,
        amountVisa,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      const transactionsResponse = await getTransactions(
        programIdVisa,
        paymentNrVisa,
        referenceIdVisa,
        accessToken,
      );
      // Assert
      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(transactionsResponse.text).toContain('succes');
    });

    it('should fail pay-out Visa Debit (CREATE CUSTOMER ERROR)', async () => {
      registrationVisa.lastName = 'mock-fail-create-customer';
      // Arrange
      await importRegistrations(programIdVisa, [registrationVisa], accessToken);
      await awaitChangePaStatus(
        programIdVisa,
        [referenceIdVisa],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [referenceIdVisa];
      // Act
      const doPaymentResponse = await doPayment(
        programIdVisa,
        paymentNrVisa,
        amountVisa,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      const transactionsResponse = await getTransactions(
        programIdVisa,
        paymentNrVisa,
        referenceIdVisa,
        accessToken,
      );
      // Assert
      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(transactionsResponse.text).toContain('CREATE CUSTOMER ERROR');
    });

    it('should fail pay-out Visa Debit (CREATE WALLET ERROR)', async () => {
      registrationVisa.lastName = 'mock-fail-create-wallet';
      // Arrange
      await importRegistrations(programIdVisa, [registrationVisa], accessToken);
      await awaitChangePaStatus(
        programIdVisa,
        [referenceIdVisa],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [referenceIdVisa];
      // Act
      const doPaymentResponse = await doPayment(
        programIdVisa,
        paymentNrVisa,
        amountVisa,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      const transactionsResponse = await getTransactions(
        programIdVisa,
        paymentNrVisa,
        referenceIdVisa,
        accessToken,
      );
      // Assert
      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(transactionsResponse.text).toContain('CREATE WALLET ERROR');
    });

    it('should fail pay-out Visa Debit (LINK CUSTOMER ERROR)', async () => {
      registrationVisa.lastName = 'mock-fail-link-customer-wallet';
      // Arrange
      await importRegistrations(programIdVisa, [registrationVisa], accessToken);
      await awaitChangePaStatus(
        programIdVisa,
        [referenceIdVisa],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [referenceIdVisa];
      // Act
      const doPaymentResponse = await doPayment(
        programIdVisa,
        paymentNrVisa,
        amountVisa,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      const transactionsResponse = await getTransactions(
        programIdVisa,
        paymentNrVisa,
        referenceIdVisa,
        accessToken,
      );
      // Assert
      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(transactionsResponse.text).toContain('LINK CUSTOMER ERROR');
    });

    it('should fail pay-out Visa Debit (CREATE DEBIT CARD ERROR)', async () => {
      registrationVisa.lastName = 'mock-fail-create-debit-card';
      // Arrange
      await importRegistrations(programIdVisa, [registrationVisa], accessToken);
      await awaitChangePaStatus(
        programIdVisa,
        [referenceIdVisa],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [referenceIdVisa];
      // Act
      const doPaymentResponse = await doPayment(
        programIdVisa,
        paymentNrVisa,
        amountVisa,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      const transactionsResponse = await getTransactions(
        programIdVisa,
        paymentNrVisa,
        referenceIdVisa,
        accessToken,
      );
      // Assert
      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(transactionsResponse.text).toContain('CREATE DEBIT CARD ERROR');
    });

    it('should fail pay-out Visa Debit (LOAD BALANCE ERROR)', async () => {
      registrationVisa.lastName = 'mock-fail-load-balance';
      // Arrange
      await importRegistrations(programIdVisa, [registrationVisa], accessToken);
      await awaitChangePaStatus(
        programIdVisa,
        [referenceIdVisa],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [referenceIdVisa];

      // Act
      // do 1st payment
      await doPayment(
        programIdVisa,
        paymentNrVisa,
        amountVisa,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      // do 2nd payment
      const doSecondPaymentResponse = await doPayment(
        programIdVisa,
        paymentNrVisa + 1,
        amountVisa,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      const transactionsResponse = await getTransactions(
        programIdVisa,
        paymentNrVisa + 1,
        referenceIdVisa,
        accessToken,
      );
      // Assert
      expect(doSecondPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doSecondPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(transactionsResponse.text).toContain('LOAD BALANCE ERROR');
    });

    // TODO: Fix this test after Intersolve has implemented the 'Active/Inactive' status on the card
    // UPDATE: I changed this test already, as we are using MOCK anyway, so not sure what above comment is about
    it('should successfully load balance Visa Debit', async () => {
      registrationVisa.lastName = 'succeed';
      // Arrange
      await importRegistrations(programIdVisa, [registrationVisa], accessToken);
      await awaitChangePaStatus(
        programIdVisa,
        [referenceIdVisa],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [referenceIdVisa];

      // Act
      // do 1st payment
      await doPayment(
        programIdVisa,
        paymentNrVisa,
        amountVisa,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      // do 2nd payment
      const doSecondPaymentResponse = await doPayment(
        programIdVisa,
        paymentNrVisa + 1,
        amountVisa,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      const transactionsResponse = await getTransactions(
        programIdVisa,
        paymentNrVisa + 1,
        referenceIdVisa,
        accessToken,
      );
      // Assert
      expect(doSecondPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doSecondPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(transactionsResponse.text).toContain('success');
    });

    it('should successfully retry pay-out after create customer error', async () => {
      registrationVisa.lastName = 'mock-fail-create-customer';
      // Arrange
      await importRegistrations(programIdVisa, [registrationVisa], accessToken);
      await awaitChangePaStatus(
        programIdVisa,
        [referenceIdVisa],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [referenceIdVisa];
      // Act
      const doPaymentResponse = await doPayment(
        programIdVisa,
        paymentNrVisa,
        amountVisa,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      // update PA
      await updateRegistration(
        programIdVisa,
        referenceIdVisa,
        { lastName: 'succeed' },
        'automated test',
        accessToken,
      );

      // retry payment
      await retryPayment(programIdVisa, paymentNrVisa, accessToken);

      await waitFor(2_000);

      const transactionsResponse = await getTransactions(
        programIdVisa,
        paymentNrVisa,
        referenceIdVisa,
        accessToken,
      );
      // Assert
      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(transactionsResponse.text).toContain('success');
    });

    it('should not multiply again on retry', async () => {
      // Arrange
      registrationVisa.lastName = 'mock-fail-create-customer';
      registrationVisa.paymentAmountMultiplier = 3;
      await importRegistrations(programIdVisa, [registrationVisa], accessToken);
      await awaitChangePaStatus(
        programIdVisa,
        [referenceIdVisa],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [referenceIdVisa];
      // Act
      await doPayment(
        programIdVisa,
        paymentNrVisa,
        amountVisa,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      // update PA
      await updateRegistration(
        programIdVisa,
        referenceIdVisa,
        { lastName: 'succeed' },
        'automated test',
        accessToken,
      );

      // retry payment
      await retryPayment(programIdVisa, paymentNrVisa, accessToken);

      await waitFor(2_000);

      const transactionsResponse = await getTransactions(
        programIdVisa,
        paymentNrVisa,
        referenceIdVisa,
        accessToken,
      );
      // Assert
      expect(transactionsResponse.body[0].amount).toBe(
        amountVisa * registrationVisa.paymentAmountMultiplier,
      );
      expect(transactionsResponse.text).toContain('succes');
    });

    // TODO: We skipped testing successful retry after:
    // 1. create wallet error
    // 2. link customer error
    // 3. create debit card error
    // 4. load balance error
    // because our current mock implementation does not support it yet
  });
});
