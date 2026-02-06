import { HttpStatus } from '@nestjs/common';

import { IntersolveVisa121ErrorText } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-121-error-text.enum';
import { VisaCard121Status } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/wallet-status-121.enum';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { messageTemplateNlrcOcw } from '@121-service/src/seed-data/message-template/message-template-nlrc-ocw.const';
import { messageTemplateNlrcPv } from '@121-service/src/seed-data/message-template/message-template-nlrc-pv.const';
import {
  programIdVisa,
  registrationVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  patchProgramFspConfigurationProperty,
  updateProgramCardDistributionByMail,
} from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  blockVisaCard,
  getMessageHistory,
  getVisaWalletsAndDetails,
  replaceVisaCardByMail,
  seedPaidRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Replace Visa debit card by mail', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  it('should successfully replace a Visa Debit card by mail', async () => {
    // Arrange
    await seedPaidRegistrations({
      registrations: [registrationVisa],
      programId: programIdVisa,
      completeStatuses: [TransactionStatusEnum.success],
    });

    await updateProgramCardDistributionByMail({
      isCardDistributionByMail: true,
      accessToken,
    });

    // Block the card first. This is because this usually happens before replacing a card in practice
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

    // Act
    await replaceVisaCardByMail(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );
    await waitFor(3_000);
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
    expect(lastMessage.attributes.body).toBe(
      messageTemplateNlrcOcw?.replaceVisaCard?.message?.en,
    );
  });

  fit('should fail to replace a Visa debit card by mail if phonenumber is missing & successfully replace after phonenumber is updated again', async () => {
    // Arrange
    console.log("STARTING TEST")
    const programIdPv = 2;
    await seedPaidRegistrations({
      registrations: [registrationVisa],
      programId: programIdPv,
      completeStatuses: [TransactionStatusEnum.success],
    });
    console.log("SEEDED REGISTRATION")
    const wrongPhoneNumber = '4534565434565434';
    console.log("ONE")
    await patchProgramFspConfigurationProperty({
      programId: programIdPv,
      configName: Fsps.intersolveVisa,
      propertyName: FspConfigurationProperties.cardDistributionByMail,
      body: { value: true },
      accessToken,
    });
    console.log("TWO")
    await updateRegistration(
      programIdPv,
      registrationVisa.referenceId,
      { phoneNumber: wrongPhoneNumber },
      'Set wrong phonenumber',
      accessToken,
    );
    console.log("THREE")
    // Act
    const replaceVisaCardResponseAttempt1 = await replaceVisaCardByMail(
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

    const replaceVisaCardResponseAttempt2 = await replaceVisaCardByMail(
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
    expect(replaceVisaCardResponseAttempt1.status).toBe(400);
    expect(replaceVisaCardResponseAttempt1.text).toContain(
      IntersolveVisa121ErrorText.replaceCard,
    );
    expect(replaceVisaCardResponseAttempt1.text).toContain(
      IntersolveVisa121ErrorText.createPhysicalCardError,
    );
    expect(visaWalletResponseAttempt1.body.cards.length).toBe(2);
    expect(visaWalletResponseAttempt1.body.cards[0].status).toBe(
      VisaCard121Status.CardDataMissing,
    );

    const lastMessageAttempt1 = messageReponseAttempt1.body[0];
    expect(lastMessageAttempt1.attributes.body).not.toBe(
      messageTemplateNlrcPv?.replaceVisaCard?.message?.en,
    );

    expect(replaceVisaCardResponseAttempt2.status).toBe(204);
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
    expect(lastMessageAttempt2.attributes.body).toBe(
      messageTemplateNlrcPv?.replaceVisaCard?.message?.en,
    );
  });

  it('should throw when replacing by mail is disabled', async () => {
    // Arrange
    const programId = programIdVisa;
    const registration = {
      ...registrationVisa,
      referenceId: 'replace-by-mail-disabled',
    };

    await seedPaidRegistrations({
      registrations: [registration],
      programId,
      completeStatuses: [TransactionStatusEnum.success],
    });

    await updateProgramCardDistributionByMail({
      isCardDistributionByMail: false,
      accessToken,
    });

    // Act
    const replaceCardResponse = await replaceVisaCardByMail(
      programId,
      registration.referenceId,
      accessToken,
    );

    // Assert
    expect(replaceCardResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(replaceCardResponse.body.message).toMatchInlineSnapshot(
      `"Replacing a card by mail is not allowed when card distribution by mail is disabled."`,
    );
  });
});
