import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/wallet-status-121.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import messageTemplatesOCW from '@121-service/src/seed-data/message-template/message-template-nlrc-ocw.json';
import {
  amountVisa,
  paymentNrVisa,
  programIdVisa,
  registrationVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import { doPayment } from '@121-service/test/helpers/program.helper';
import {
  awaitChangePaStatus,
  getMessageHistory,
  getVisaWalletsAndDetails,
  importRegistrations,
  issueNewVisaCard,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Issue new Visa debit card', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  it('should succesfully issue a new Visa Debit card', async () => {
    // Arrange
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangePaStatus(
      programIdVisa,
      [registrationVisa.referenceId],
      RegistrationStatusEnum.included,
      accessToken,
    );
    const paymentReferenceIds = [registrationVisa.referenceId];
    await doPayment(
      programIdVisa,
      paymentNrVisa,
      amountVisa,
      paymentReferenceIds,
      accessToken,
    );

    // Act
    await waitFor(2_000);
    await issueNewVisaCard(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );
    await waitFor(2_000);
    const visaWalletResponse = await getVisaWalletsAndDetails(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    const messageReponse = await getMessageHistory(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    // Assert
    expect(visaWalletResponse.body.cards.length).toBe(2);
    // mock returns hard-coded 'active', while non-mock would return 'inactive', so either way not 'blocked'
    expect(visaWalletResponse.body.cards[0].status).not.toBe(
      VisaCard121Status.Blocked,
    );
    expect(visaWalletResponse.body.cards[1].status).toBe(
      VisaCard121Status.Substituted,
    );
    const lastMessage = messageReponse.body[0];
    expect(lastMessage.body).toBe(
      messageTemplatesOCW.reissueVisaCard.message.en,
    );
  });
});
