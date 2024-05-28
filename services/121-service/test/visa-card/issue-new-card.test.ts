import { IntersolveVisa121ErrorText } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-121-error-text.enum';
import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/wallet-status-121.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import messageTemplatesOCW from '@121-service/src/seed-data/message-template/message-template-nlrc-ocw.json';
import messageTemplatesPv from '@121-service/src/seed-data/message-template/message-template-nlrc-pv.json';
import {
  programIdVisa,
  registrationVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  getMessageHistory,
  getVisaWalletsAndDetails,
  issueNewVisaCard,
  seedPaidRegistrations,
  updateRegistration,
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
    await seedPaidRegistrations([registrationVisa], programIdVisa);

    // Act
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

  it('should fail to issue a new Visa Debit card if phonenumber is missing & succesfully reissue after phonenumber is updated again', async () => {
    // Arrange
    const programIdPv = 2;
    await seedPaidRegistrations([registrationVisa], programIdPv);
    const wrongPhoneNumber = '4534565434565434';

    await updateRegistration(
      programIdPv,
      registrationVisa.referenceId,
      { phoneNumber: wrongPhoneNumber },
      'Set wrong phonenumber',
      accessToken,
    );

    // Act
    const issueVisaCardResponseAttempt1 = await issueNewVisaCard(
      programIdPv,
      registrationVisa.referenceId,
      accessToken,
    );
    await waitFor(2_000);
    const visaWalletResponseAttempt1 = await getVisaWalletsAndDetails(
      programIdPv,
      registrationVisa.referenceId,
      accessToken,
    );
    const messageReponseAttempt1 = await getMessageHistory(
      programIdPv,
      registrationVisa.referenceId,
      accessToken,
    );

    await updateRegistration(
      programIdPv,
      registrationVisa.referenceId,
      { phoneNumber: '14155238889' },
      'add correct phonenumber again',
      accessToken,
    );

    const issueVisaCardResponseAttempt2 = await issueNewVisaCard(
      programIdPv,
      registrationVisa.referenceId,
      accessToken,
    );
    await waitFor(2_000);
    const visaWalletResponseAttempt2 = await getVisaWalletsAndDetails(
      programIdPv,
      registrationVisa.referenceId,
      accessToken,
    );
    const messageReponseAttempt2 = await getMessageHistory(
      programIdPv,
      registrationVisa.referenceId,
      accessToken,
    );

    // Assert
    expect(issueVisaCardResponseAttempt1.status).toBe(404);
    expect(issueVisaCardResponseAttempt1.text).toContain(
      IntersolveVisa121ErrorText.reissueCard,
    );
    expect(issueVisaCardResponseAttempt1.text).toContain(
      IntersolveVisa121ErrorText.createPhysicalCardError,
    );
    expect(visaWalletResponseAttempt1.body.cards.length).toBe(2);
    expect(visaWalletResponseAttempt1.body.cards[0].status).toBe(
      VisaCard121Status.CardDataMissing,
    );

    const lastMessageAttempt1 = messageReponseAttempt1.body[0];
    expect(lastMessageAttempt1.body).not.toBe(
      messageTemplatesPv.reissueVisaCard.message.en,
    );

    expect(issueVisaCardResponseAttempt2.status).toBe(204);
    expect(visaWalletResponseAttempt2.body.cards.length).toBe(3);
    expect(visaWalletResponseAttempt2.body.cards[0].status).toBe(
      VisaCard121Status.Issued,
    );
    expect(visaWalletResponseAttempt2.body.cards[1].status).toBe(
      VisaCard121Status.Substituted,
    );
    expect(visaWalletResponseAttempt2.body.cards[2].status).toBe(
      VisaCard121Status.Substituted,
    );
    const lastMessageAttempt2 = messageReponseAttempt2.body[0];
    expect(lastMessageAttempt2.body).toBe(
      messageTemplatesPv.reissueVisaCard.message.en,
    );
  });
});
