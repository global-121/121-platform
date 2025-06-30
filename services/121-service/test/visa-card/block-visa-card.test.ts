import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/wallet-status-121.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { messageTemplateNlrcOcw } from '@121-service/src/seed-data/message-template/message-template-nlrc-ocw.const';
import {
  programIdVisa,
  registrationVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  blockVisaCard,
  getMessageHistory,
  getVisaWalletsAndDetails,
  seedPaidRegistrations,
  unblockVisaCard,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('(Un)Block visa debit card', () => {
  let accessToken: string;

  beforeEach(async () => {
    await waitFor(1_000);
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    await waitFor(3_000);
  });

  it('should succesfully block a Visa Debit card', async () => {
    // Arrange
    await seedPaidRegistrations([registrationVisa], programIdVisa);

    // Act
    const visaWalletResponseBeforeBlock = await getVisaWalletsAndDetails(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );
    const tokencode = visaWalletResponseBeforeBlock.body.cards[0].tokenCode;

    const blockVisaResponse = await blockVisaCard(
      programIdVisa,
      tokencode,
      accessToken,
      registrationVisa.referenceId,
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
    expect(blockVisaResponse.status).toBe(200);
    expect(visaWalletResponseAfterBlock.body.cards[0].status).toBe(
      VisaCard121Status.Paused,
    );
    const lastMessage = messageReponse.body[0];
    expect(lastMessage.attributes.body).toBe(
      messageTemplateNlrcOcw.pauseVisaCard?.message?.en,
    );
  });

  it('should succesfully unblock a Visa Debit card', async () => {
    // Arrange
    await seedPaidRegistrations([registrationVisa], programIdVisa);

    // Act
    const visaWalletResponseBeforeBlock = await getVisaWalletsAndDetails(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );
    const tokencode = visaWalletResponseBeforeBlock.body.cards[0].tokenCode;

    await blockVisaCard(
      programIdVisa,
      tokencode,
      accessToken,
      registrationVisa.referenceId,
    );
    const unblockVisaResponse = await unblockVisaCard(
      programIdVisa,
      tokencode,
      accessToken,
      registrationVisa.referenceId,
    );
    const visaWalletResponse = await getVisaWalletsAndDetails(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    await waitFor(4_000); // the last message otherwise was not in the db yet
    const messageReponse = await getMessageHistory(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );
    // Assert
    expect(unblockVisaResponse.status).toBe(200);
    expect(visaWalletResponse.body.cards[0].status).not.toBe(
      VisaCard121Status.Blocked,
    );
    const lastMessage = messageReponse.body[0];
    expect(lastMessage.attributes.body).toBe(
      messageTemplateNlrcOcw?.unpauseVisaCard?.message?.en,
    );
  });
});
