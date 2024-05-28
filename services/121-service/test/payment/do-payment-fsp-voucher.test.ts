import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import { adminOwnerDto } from '@121-service/test/fixtures/user-owner';
import {
  doPayment,
  getTransactions,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangePaStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';
import { HttpStatus } from '@nestjs/common';

describe('Do payment to 1 PA', () => {
  const programId = programIdPV;
  const payment = 1;
  const amount = 22;
  const registrationAh = {
    referenceId: '63e62864557597e0a-AH',
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier: 1,
    nameFirst: 'John',
    nameLast: 'Smith',
    phoneNumber: '14155238886',
    fspName: FinancialServiceProviderName.intersolveVoucherWhatsapp,
    whatsappPhoneNumber: '14155238886',
  };

  describe('with FSP: Intersolve Voucher WhatsApp', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.nlrcMultiple);
      accessToken = await getAccessToken();
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
