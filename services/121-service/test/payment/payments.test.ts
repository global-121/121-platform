import { HttpStatus } from '@nestjs/common';
import { IntersolveJumboResultCode } from '../../src/payments/fsp-integration/intersolve-jumbo/enum/intersolve-jumbo-result-code.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.model';
import { StatusEnum } from '../../src/shared/enum/status.enum';
import {
  changePhase,
  doPayment,
  getTransactions,
} from '../helpers/program.helper';
import {
  changePaStatus,
  importRegistrations,
} from '../helpers/registration.helper';
import { login, resetDB } from '../helpers/utility.helper';

const seedScript = 'nlrc-multiple';
const programId = 3;
const referenceId = '63e62864557597e0d';
const registration = {
  referenceId: referenceId,
  preferredLanguage: 'en',
  paymentAmountMultiplier: 1,
  firstName: 'John',
  lastName: 'Smith',
  phoneNumber: 14155238886,
  fspName: 'Intersolve-jumbo-physical',
  whatsappPhoneNumber: 14155238886,
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
};
const timer = (ms) => new Promise((res) => setTimeout(res, ms));

let access_token: string;

describe('Do payment to 1 PA', () => {
  describe('with FSP: Intersolve Jumbo physical', () => {
    beforeEach(async () => {
      await resetDB(seedScript);
      const loginResponse = await login();
      access_token = loginResponse.headers['set-cookie'][0].split(';')[0];
      await changePhase(
        programId,
        ProgramPhase.registrationValidation,
        access_token,
      );
      await changePhase(programId, ProgramPhase.inclusion, access_token);
      await changePhase(programId, ProgramPhase.payment, access_token);
    });

    it('should succesfully pay-out', async () => {
      await importRegistrations(programId, [registration], access_token);
      await changePaStatus(programId, [referenceId], 'include', access_token);
      const paymentReferenceIds = [referenceId];
      const doPaymentResponse = await doPayment(
        programId,
        1,
        22,
        paymentReferenceIds,
        access_token,
      );

      let getTransactionsBody = [];
      while (getTransactionsBody.length <= 0) {
        getTransactionsBody = (
          await getTransactions(programId, 1, referenceId, access_token)
        ).body;
        if (getTransactionsBody.length > 0) {
          break;
        }
        await timer(2000);
      }

      expect(doPaymentResponse.status).toBe(HttpStatus.CREATED);
      expect(doPaymentResponse.text).toBe(String(paymentReferenceIds.length));
      expect(getTransactionsBody[0].status).toBe(StatusEnum.success);
      expect(getTransactionsBody[0].errorMessage).toBe(null);
    });

    it('should give error about address', async () => {
      registration.addressCity = null;
      await importRegistrations(programId, [registration], access_token);
      await changePaStatus(programId, [referenceId], 'include', access_token);
      const paymentReferenceIds = [referenceId];
      const doPaymentResponse = await doPayment(
        programId,
        1,
        22,
        paymentReferenceIds,
        access_token,
      );

      let getTransactionsBody = [];
      while (getTransactionsBody.length <= 0) {
        getTransactionsBody = (
          await getTransactions(programId, 1, referenceId, access_token)
        ).body;
        if (getTransactionsBody.length > 0) {
          break;
        }
        await timer(2000);
      }

      expect(doPaymentResponse.status).toBe(HttpStatus.CREATED);
      expect(doPaymentResponse.text).toBe(String(paymentReferenceIds.length));
      expect(getTransactionsBody[0].status).toBe(StatusEnum.error);
      expect(getTransactionsBody[0].errorMessage).toContain(
        IntersolveJumboResultCode.InvalidOrderLine,
      );
    });
  });

  describe('with FSP: Intersolve AH digital voucher', () => {});

  describe('with FSP: Intersolve Visa V-pay', () => {});
});
