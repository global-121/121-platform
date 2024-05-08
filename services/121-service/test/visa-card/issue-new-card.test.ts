import messageTemplatesOCW from '../../seed-data/message-template/message-template-nlrc-ocw.json';
import {
  amountVisa,
  paymentNrVisa,
  programIdVisa,
  registrationVisa,
} from '../../seed-data/mock/visa-card.data';
import { WalletCardStatus121 } from '../../src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { waitFor } from '../../src/utils/waitFor.helper';
import { doPayment } from '../helpers/program.helper';
import {
  awaitChangePaStatus,
  getMessageHistory,
  getVisaWalletsAndDetails,
  importRegistrations,
  issueNewVisaCard,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';

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
    expect(visaWalletResponse.body.wallets.length).toBe(2);
    // mock returns hard-coded 'active', while non-mock would return 'inactive', so either way not 'blocked'
    expect(visaWalletResponse.body.wallets[0].status).not.toBe(
      WalletCardStatus121.Blocked,
    );
    expect(visaWalletResponse.body.wallets[1].status).toBe(
      WalletCardStatus121.Blocked,
    );
    const lastMessage = messageReponse.body[0];
    expect(lastMessage.body).toBe(
      messageTemplatesOCW.reissueVisaCard.message.en,
    );
  });
});
