import { HttpStatus } from '@nestjs/common';
import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { IntersolveJumboResultCode } from '../../src/payments/fsp-integration/intersolve-jumbo/enum/intersolve-jumbo-result-code.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
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
import { getAccessToken, resetDB, waitFor } from '../helpers/utility.helper';

describe('Do payment to 1 PA', () => {
  const programId = 3;
  const referenceId = '63e62864557597e0d';
  const payment = 1;
  const amount = 22;
  const registration = {
    referenceId: referenceId,
    preferredLanguage: 'en',
    paymentAmountMultiplier: 1,
    firstName: 'John',
    lastName: 'Smith',
    phoneNumber: '14155238886',
    fspName: FspName.intersolveJumboPhysical,
    whatsappPhoneNumber: '14155238886',
    addressStreet: 'Teststraat',
    addressHouseNumber: '1',
    addressHouseNumberAddition: '',
    addressPostalCode: '1234AB',
    addressCity: 'Stad',
  };

  describe('with FSP: Intersolve Jumbo physical', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.nlrcMultiple);
      accessToken = await getAccessToken();

      await changePhase(
        programId,
        ProgramPhase.registrationValidation,
        accessToken,
      );
      await changePhase(programId, ProgramPhase.inclusion, accessToken);
      await changePhase(programId, ProgramPhase.payment, accessToken);
    });

    it('should succesfully pay-out', async () => {
      // Arrange
      await importRegistrations(programId, [registration], accessToken);
      await changePaStatus(programId, [referenceId], 'include', accessToken);
      const paymentReferenceIds = [referenceId];

      // Act
      const doPaymentResponse = await doPayment(
        programId,
        payment,
        amount,
        paymentReferenceIds,
        accessToken,
      );

      let getTransactionsBody = [];
      while (getTransactionsBody.length <= 0) {
        getTransactionsBody = (
          await getTransactions(programId, 1, referenceId, accessToken)
        ).body;
        if (getTransactionsBody.length > 0) {
          break;
        }
        await waitFor(2_000);
      }

      // Assert
      expect(doPaymentResponse.status).toBe(HttpStatus.CREATED);
      expect(doPaymentResponse.text).toBe(String(paymentReferenceIds.length));
      expect(getTransactionsBody[0].status).toBe(StatusEnum.success);
      expect(getTransactionsBody[0].errorMessage).toBe(null);
    });

    it('should give error about address', async () => {
      // Arrange
      registration.addressCity = null;
      await importRegistrations(programId, [registration], accessToken);
      await changePaStatus(programId, [referenceId], 'include', accessToken);
      const paymentReferenceIds = [referenceId];

      // Act
      const doPaymentResponse = await doPayment(
        programId,
        payment,
        amount,
        paymentReferenceIds,
        accessToken,
      );

      let getTransactionsBody = [];
      while (getTransactionsBody.length <= 0) {
        getTransactionsBody = (
          await getTransactions(programId, 1, referenceId, accessToken)
        ).body;
        if (getTransactionsBody.length > 0) {
          break;
        }
        await waitFor(2_000);
      }

      // Assert
      expect(doPaymentResponse.status).toBe(HttpStatus.CREATED);
      expect(doPaymentResponse.text).toBe(String(paymentReferenceIds.length));
      expect(getTransactionsBody[0].status).toBe(StatusEnum.error);
      expect(getTransactionsBody[0].errorMessage).toContain(
        IntersolveJumboResultCode.InvalidOrderLine,
      );
    });
  });

  describe.skip('with FSP: Intersolve AH digital voucher', () => {
    it('should succesfully pay-out', () => {});
  });

  describe.skip('with FSP: Intersolve Visa V-pay', () => {
    it('should succesfully pay-out', () => {});
  });
});
