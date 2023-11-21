import messageTemplatesOCW from '../../seed-data/message-template/message-template-nlrc-ocw.json';
import { WalletCardStatus121 } from '../../src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.model';
import { changePhase, doPayment } from '../helpers/program.helper';
import {
  awaitChangePaStatus,
  getMessageHistory,
  getVisaWalletsAndDetails,
  importRegistrations,
  issueNewVisaCard,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import { waitFor } from '../../src/utils/waitFor.helper';
import {
  amountVisa,
  paymentNrVisa,
  programIdVisa,
  referenceIdVisa,
  registrationVisa,
} from './visa-card.data';

describe('Issue new Visa debit card', () => {
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

  it('should succesfully issue a new Visa Debit card', async () => {
    // Arrange
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangePaStatus(
      programIdVisa,
      [referenceIdVisa],
      RegistrationStatusEnum.included,
      accessToken,
    );
    const paymentReferenceIds = [referenceIdVisa];
    await doPayment(
      programIdVisa,
      paymentNrVisa,
      amountVisa,
      paymentReferenceIds,
      accessToken,
    );

    // Act
    await waitFor(2_000);
    await issueNewVisaCard(programIdVisa, referenceIdVisa, accessToken);
    await waitFor(2_000);
    const visaWalletResponse = await getVisaWalletsAndDetails(
      programIdVisa,
      referenceIdVisa,
      accessToken,
    );

    const messageReponse = await getMessageHistory(
      programIdVisa,
      referenceIdVisa,
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
