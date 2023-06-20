import { HttpStatus } from '@nestjs/common';
import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.model';
import {
  changePhase,
  doPayment,
  getTransactions,
  retryPayment,
} from '../helpers/program.helper';
import {
  changePaStatus,
  importRegistrations,
  updatePa,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB, waitFor } from '../helpers/utility.helper';
describe('Do payment to 1 PA', () => {
  const programId = 3;
  const payment = 1;
  const amount = 22;

  const referenceIdVisa = '2982g82bdsf89sdsd';
  const registrationVisa = {
    referenceId: referenceIdVisa,
    preferredLanguage: 'en',
    paymentAmountMultiplier: 1,
    firstName: 'Jane',
    lastName: 'Doe',
    phoneNumber: '14155238887',
    fspName: FspName.intersolveVisa,
    whatsappPhoneNumber: '14155238887',
    addressStreet: 'Teststraat',
    addressHouseNumber: '1',
    addressHouseNumberAddition: '',
    addressPostalCode: '1234AB',
    addressCity: 'Stad',
  };
  describe('with FSP: Intersolve Visa Debit', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.nlrcMultiple);
      accessToken = await getAccessToken();
      await waitFor(2_000);

      await changePhase(
        programId,
        ProgramPhase.registrationValidation,
        accessToken,
      );
      await changePhase(programId, ProgramPhase.inclusion, accessToken);
      await changePhase(programId, ProgramPhase.payment, accessToken);
    });

    it('should succesfully pay-out Visa Debit', async () => {
      // Arrange
      await importRegistrations(programId, [registrationVisa], accessToken);
      await changePaStatus(
        programId,
        [referenceIdVisa],
        'include',
        accessToken,
      );
      const paymentReferenceIds = [referenceIdVisa];
      // Act
      const doPaymentResponse = await doPayment(
        programId,
        payment,
        amount,
        paymentReferenceIds,
        accessToken,
      );
      // Assert
      expect(doPaymentResponse.status).toBe(HttpStatus.CREATED);
      expect(doPaymentResponse.text).toBe(String(paymentReferenceIds.length));
    });

    it('should fail pay-out Visa Debit (CREATE CUSTOMER ERROR)', async () => {
      registrationVisa.lastName = 'mock-fail-create-customer';
      // Arrange
      await importRegistrations(programId, [registrationVisa], accessToken);
      await changePaStatus(
        programId,
        [referenceIdVisa],
        'include',
        accessToken,
      );
      const paymentReferenceIds = [referenceIdVisa];
      // Act
      const doPaymentResponse = await doPayment(
        programId,
        payment,
        amount,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      const transactionsResponse = await getTransactions(
        programId,
        payment,
        referenceIdVisa,
        accessToken,
      );
      // Assert
      expect(doPaymentResponse.status).toBe(HttpStatus.CREATED);
      expect(doPaymentResponse.text).toBe(String(paymentReferenceIds.length));
      expect(transactionsResponse.text).toContain('CREATE CUSTOMER ERROR');
    });

    it('should fail pay-out Visa Debit (CREATE WALLET ERROR)', async () => {
      registrationVisa.lastName = 'mock-fail-create-wallet';
      // Arrange
      await importRegistrations(programId, [registrationVisa], accessToken);
      await changePaStatus(
        programId,
        [referenceIdVisa],
        'include',
        accessToken,
      );
      const paymentReferenceIds = [referenceIdVisa];
      // Act
      const doPaymentResponse = await doPayment(
        programId,
        payment,
        amount,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      const transactionsResponse = await getTransactions(
        programId,
        payment,
        referenceIdVisa,
        accessToken,
      );
      // Assert
      expect(doPaymentResponse.status).toBe(HttpStatus.CREATED);
      expect(doPaymentResponse.text).toBe(String(paymentReferenceIds.length));
      expect(transactionsResponse.text).toContain('CREATE WALLET ERROR');
    });

    it('should fail pay-out Visa Debit (LINK CUSTOMER ERROR)', async () => {
      registrationVisa.lastName = 'mock-fail-link-customer-wallet';
      // Arrange
      await importRegistrations(programId, [registrationVisa], accessToken);
      await changePaStatus(
        programId,
        [referenceIdVisa],
        'include',
        accessToken,
      );
      const paymentReferenceIds = [referenceIdVisa];
      // Act
      const doPaymentResponse = await doPayment(
        programId,
        payment,
        amount,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      const transactionsResponse = await getTransactions(
        programId,
        payment,
        referenceIdVisa,
        accessToken,
      );
      // Assert
      expect(doPaymentResponse.status).toBe(HttpStatus.CREATED);
      expect(doPaymentResponse.text).toBe(String(paymentReferenceIds.length));
      expect(transactionsResponse.text).toContain('LINK CUSTOMER ERROR');
    });

    it('should fail pay-out Visa Debit (CREATE DEBIT CARD ERROR)', async () => {
      registrationVisa.lastName = 'mock-fail-create-debit-card';
      // Arrange
      await importRegistrations(programId, [registrationVisa], accessToken);
      await changePaStatus(
        programId,
        [referenceIdVisa],
        'include',
        accessToken,
      );
      const paymentReferenceIds = [referenceIdVisa];
      // Act
      const doPaymentResponse = await doPayment(
        programId,
        payment,
        amount,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      const transactionsResponse = await getTransactions(
        programId,
        payment,
        referenceIdVisa,
        accessToken,
      );
      // Assert
      expect(doPaymentResponse.status).toBe(HttpStatus.CREATED);
      expect(doPaymentResponse.text).toBe(String(paymentReferenceIds.length));
      expect(transactionsResponse.text).toContain('CREATE DEBIT CARD ERROR');
    });

    it('should fail pay-out Visa Debit (LOAD BALANCE ERROR)', async () => {
      registrationVisa.lastName = 'mock-fail-load-balance';
      // Arrange
      await importRegistrations(programId, [registrationVisa], accessToken);
      await changePaStatus(
        programId,
        [referenceIdVisa],
        'include',
        accessToken,
      );
      const paymentReferenceIds = [referenceIdVisa];

      // Act
      // do 1st payment
      await doPayment(
        programId,
        payment,
        amount,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      // do 2nd payment
      const doSecondPaymentResponse = await doPayment(
        programId,
        payment + 1,
        amount,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      const transactionsResponse = await getTransactions(
        programId,
        payment + 1,
        referenceIdVisa,
        accessToken,
      );
      // Assert
      expect(doSecondPaymentResponse.status).toBe(HttpStatus.CREATED);
      expect(doSecondPaymentResponse.text).toBe(
        String(paymentReferenceIds.length),
      );
      expect(transactionsResponse.text).toContain('LOAD BALANCE ERROR');
    });

    //TODO: Fix this test after Intersolve has implemented the 'Active/Inactive' status on the card
    it('should successfully load balance Visa Debit', async () => {
      registrationVisa.lastName = 'mock-fail-load-balance';
      // Arrange
      await importRegistrations(programId, [registrationVisa], accessToken);
      await changePaStatus(
        programId,
        [referenceIdVisa],
        'include',
        accessToken,
      );
      const paymentReferenceIds = [referenceIdVisa];

      // Act
      // do 1st payment
      await doPayment(
        programId,
        payment,
        amount,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      // do 2nd payment
      const doSecondPaymentResponse = await doPayment(
        programId,
        payment + 1,
        amount,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      const transactionsResponse = await getTransactions(
        programId,
        payment + 1,
        referenceIdVisa,
        accessToken,
      );
      // Assert
      expect(doSecondPaymentResponse.status).toBe(HttpStatus.CREATED);
      expect(doSecondPaymentResponse.text).toBe(
        String(paymentReferenceIds.length),
      );
      expect(transactionsResponse.text).toContain('LOAD BALANCE ERROR');
    });

    it('should successfully retry pay-out after create customer error', async () => {
      registrationVisa.lastName = 'mock-fail-create-customer';
      // Arrange
      await importRegistrations(programId, [registrationVisa], accessToken);
      await changePaStatus(
        programId,
        [referenceIdVisa],
        'include',
        accessToken,
      );
      const paymentReferenceIds = [referenceIdVisa];
      // Act
      const doPaymentResponse = await doPayment(
        programId,
        payment,
        amount,
        paymentReferenceIds,
        accessToken,
      );

      await waitFor(2_000);

      // update PA
      await updatePa(
        programId,
        referenceIdVisa,
        'lastName',
        'succeed',
        accessToken,
      );

      // retry payment
      await retryPayment(programId, payment, accessToken);

      await waitFor(2_000);

      const transactionsResponse = await getTransactions(
        programId,
        payment,
        referenceIdVisa,
        accessToken,
      );
      // Assert
      expect(doPaymentResponse.status).toBe(HttpStatus.CREATED);
      expect(doPaymentResponse.text).toBe(String(paymentReferenceIds.length));
      expect(transactionsResponse.text).toContain('success');
    });

    // TODO: We skipped testing successful retry after:
    // 1. create wallet error
    // 2. link customer error
    // 3. create debit card error
    // 4. load balance error
    // because our current mock implementation does not support it yet
  });
});
