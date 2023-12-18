import { HttpStatus } from '@nestjs/common';
import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { IntersolveJumboResultCode } from '../../src/payments/fsp-integration/intersolve-jumbo/enum/intersolve-jumbo-result-code.enum';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.enum';
import { StatusEnum } from '../../src/shared/enum/status.enum';
import { waitFor } from '../../src/utils/waitFor.helper';
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

describe('Do payment to 1 PA', () => {
  const programId = 3;
  const referenceIdJumbo = '63e62864557597e0d';
  const payment = 1;
  const amount = 22;
  const registrationJumbo = {
    referenceId: referenceIdJumbo,
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
      await importRegistrations(programId, [registrationJumbo], accessToken);
      await awaitChangePaStatus(
        programId,
        [referenceIdJumbo],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [referenceIdJumbo];

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
      while (getTransactionsBody.length <= 0) {
        getTransactionsBody = (
          await getTransactions(
            programId,
            payment,
            referenceIdJumbo,
            accessToken,
          )
        ).body;
        if (getTransactionsBody.length > 0) {
          break;
        }
        await waitFor(2_000);
      }

      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(getTransactionsBody[0].status).toBe(StatusEnum.success);
      expect(getTransactionsBody[0].errorMessage).toBe(null);
    });

    it('should give error about address', async () => {
      // Arrange
      registrationJumbo.addressCity = null;
      await importRegistrations(programId, [registrationJumbo], accessToken);
      await awaitChangePaStatus(
        programId,
        [referenceIdJumbo],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [referenceIdJumbo];

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
      while (getTransactionsBody.length <= 0) {
        getTransactionsBody = (
          await getTransactions(
            programId,
            payment,
            referenceIdJumbo,
            accessToken,
          )
        ).body;
        if (getTransactionsBody.length > 0) {
          break;
        }
        await waitFor(2_000);
      }

      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(getTransactionsBody[0].status).toBe(StatusEnum.error);
      expect(getTransactionsBody[0].errorMessage).toContain(
        IntersolveJumboResultCode.InvalidOrderLine,
      );
    });
  });
});
