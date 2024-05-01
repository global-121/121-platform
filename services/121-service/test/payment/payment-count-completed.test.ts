import { HttpStatus } from '@nestjs/common';
import { FinancialServiceProviderName } from '../../src/financial-service-provider/enum/financial-service-provider-name.enum';
import { LanguageEnum } from '../../src/registration/enum/language.enum';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.enum';
import { StatusEnum } from '../../src/shared/enum/status.enum';
import { waitFor } from '../../src/utils/waitFor.helper';
import {
  changePhase,
  doPayment,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '../helpers/program.helper';
import {
  awaitChangePaStatus,
  getRegistrations,
  importRegistrations,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import { programIdPV } from '../registrations/pagination/pagination-data';

describe('Do a payment to a PA with maxPayments=1', () => {
  const programId = programIdPV;
  const payment = 1;
  const amount = 25;
  const registrationAh = {
    referenceId: '63e62864557597e0d-AH',
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier: 1,
    nameFirst: 'John',
    nameLast: 'Smith',
    phoneNumber: '14155238886',
    fspName: FinancialServiceProviderName.intersolveVoucherWhatsapp,
    whatsappPhoneNumber: '14155238886',
    maxPayments: 1,
  };

  describe('with FSP: Intersolve Voucher WhatsApp', () => {
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

    it('should set registration to complete', async () => {
      // Arrange
      await importRegistrations(programId, [registrationAh], accessToken);
      await awaitChangePaStatus(
        programId,
        [registrationAh.referenceId],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [registrationAh.referenceId];

      // Act
      const doPaymentResponse = await doPayment(
        programId,
        payment,
        amount,
        paymentReferenceIds,
        accessToken,
      );

      // Assert
      await waitForPaymentTransactionsToComplete(
        programId,
        [registrationAh.referenceId],
        accessToken,
        10_000,
      );

      const getTransactionsRes = await getTransactions(
        programId,
        payment,
        registrationAh.referenceId,
        accessToken,
      );
      const getTransactionsBody = getTransactionsRes.body;
      // Wait for registration to be updated
      const timeout = 80_000; // Timeout in milliseconds
      const interval = 1_000; // Interval between retries in milliseconds
      let elapsedTime = 0;
      let getRegistration = null;
      while (
        (!getRegistration || getRegistration.paymentCount !== 1) &&
        elapsedTime < timeout
      ) {
        const getRegistraitonRes = await getRegistrations(
          programId,
          null,
          accessToken,
        );
        getRegistration = getRegistraitonRes.body.data[0];

        await waitFor(interval);
        elapsedTime += interval;
      }
      // Assert
      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(getTransactionsBody[0].status).toBe(StatusEnum.success);
      expect(getTransactionsBody[0].errorMessage).toBe(null);

      expect(getRegistration.status).toBe(RegistrationStatusEnum.completed);
      expect(getRegistration.paymentCountRemaining).toBe(0);
      expect(getRegistration.paymentCount).toBe(1);
    });
  });
});
