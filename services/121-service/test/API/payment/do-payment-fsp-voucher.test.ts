import { HttpStatus } from '@nestjs/common';
import { FspName } from '../../../src/fsp/enum/fsp-name.enum';
import { LanguageEnum } from '../../../src/registration/enum/language.enum';
import { RegistrationStatusEnum } from '../../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../../src/shared/enum/program-phase.enum';
import { StatusEnum } from '../../../src/shared/enum/status.enum';
import { waitFor } from '../../../src/utils/waitFor.helper';
import { adminOwnerDto } from '../fixtures/user-owner';
import {
  changePhase,
  doPayment,
  getTransactions,
} from '../helpers/program.helper';
import {
  awaitChangePaStatus,
  importRegistrations,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import { programIdPV } from '../registrations/pagination/pagination-data';

describe('Do payment to 1 PA', () => {
  const programId = programIdPV;
  const payment = 1;
  const amount = 22;
  const registrationAh = {
    referenceId: '63e62864557597e0d-AH',
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier: 1,
    nameFirst: 'John',
    nameLast: 'Smith',
    phoneNumber: '14155238886',
    fspName: FspName.intersolveVoucherWhatsapp,
    whatsappPhoneNumber: '14155238886',
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

    it('should succesfully pay-out', async () => {
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
      let getTransactionsBody = [];
      let attempts = 0;
      while (attempts <= 10) {
        attempts++;
        getTransactionsBody = (
          await getTransactions(
            programId,
            payment,
            registrationAh.referenceId,
            accessToken,
          )
        ).body;

        if (
          getTransactionsBody.length > 0 &&
          getTransactionsBody[0].status === StatusEnum.success
        ) {
          break;
        }

        await waitFor(2_000);
      }

      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(doPaymentResponse.body.totalFilterCount).toBe(
        paymentReferenceIds.length,
      );
      expect(doPaymentResponse.body.nonApplicableCount).toBe(0);
      expect(doPaymentResponse.body.sumPaymentAmountMultiplier).toBe(
        registrationAh.paymentAmountMultiplier,
      );
      expect(getTransactionsBody[0].status).toBe(StatusEnum.success);
      expect(getTransactionsBody[0].errorMessage).toBe(null);
      expect(getTransactionsBody[0].user).toMatchObject(adminOwnerDto);
    });
  });
});
