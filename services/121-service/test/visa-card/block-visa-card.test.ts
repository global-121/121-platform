import { WalletCardStatus121 } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
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
  blockVisaCard,
  getMessageHistory,
  getVisaWalletsAndDetails,
  importRegistrations,
  unblockVisaCard,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Block visa debit card', () => {
  let accessToken: string;

  beforeEach(async () => {
    await waitFor(1_000);
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    await waitFor(3_000);
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
