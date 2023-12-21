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
import { ProgramPhase } from '../../src/shared/enum/program-phase.enum';
import { waitFor } from '../../src/utils/waitFor.helper';
import { changePhase, doPayment } from '../helpers/program.helper';
import {
  awaitChangePaStatus,
  blockVisaCard,
  getMessageHistory,
  getVisaWalletsAndDetails,
  importRegistrations,
  unblockVisaCard,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';

describe('Block visa debit card', () => {
  let accessToken: string;

  beforeEach(async () => {
    await waitFor(1_000);
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    await waitFor(3_000);

    await changePhase(
      programIdVisa,
      ProgramPhase.registrationValidation,
      accessToken,
    );
    await changePhase(programIdVisa, ProgramPhase.inclusion, accessToken);
    await changePhase(programIdVisa, ProgramPhase.payment, accessToken);
  });

  it('should succesfully block a Visa Debit card', async () => {
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
    const visaWalletResponseBeforeBlock = await getVisaWalletsAndDetails(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );
    const tokencode = visaWalletResponseBeforeBlock.body.wallets[0].tokenCode;

    const blockVisaResponse = await blockVisaCard(
      programIdVisa,
      tokencode,
      accessToken,
    );

    const visaWalletResponseAfterBlock = await getVisaWalletsAndDetails(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    await waitFor(2_000); // the last message otherwise was not in the db yet
    const messageReponse = await getMessageHistory(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );
    // Assert
    expect(blockVisaResponse.status).toBe(201);
    expect(blockVisaResponse.body.status).toBe(204);
    expect(visaWalletResponseAfterBlock.body.wallets[0].status).toBe(
      WalletCardStatus121.Paused,
    );
    const lastMessage = messageReponse.body[0];
    expect(lastMessage.body).toBe(messageTemplatesOCW.blockVisaCard.message.en);
  });

  it('should succesfully unblock a Visa Debit card', async () => {
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
    const visaWalletResponseBeforeBlock = await getVisaWalletsAndDetails(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );
    const tokencode = visaWalletResponseBeforeBlock.body.wallets[0].tokenCode;

    await blockVisaCard(programIdVisa, tokencode, accessToken);
    const unblockVisaResponse = await unblockVisaCard(
      programIdVisa,
      tokencode,
      accessToken,
    );
    const visaWalletResponse = await getVisaWalletsAndDetails(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    await waitFor(2_000); // the last message otherwise was not in the db yet
    const messageReponse = await getMessageHistory(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );
    // Assert
    expect(unblockVisaResponse.status).toBe(201);
    expect(unblockVisaResponse.body.status).toBe(204);
    expect(visaWalletResponse.body.wallets[0].status).not.toBe(
      WalletCardStatus121.Blocked,
    );
    const lastMessage = messageReponse.body[0];
    expect(lastMessage.body).toBe(
      messageTemplatesOCW.unblockVisaCard.message.en,
    );
  });
});
