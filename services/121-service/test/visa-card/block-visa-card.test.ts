import { HttpStatus } from '@nestjs/common';

import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/wallet-status-121.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { messageTemplateNlrcOcw } from '@121-service/src/seed-data/message-template/message-template-nlrc-ocw.const';
import {
  programIdVisa,
  registrationVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { waitForMessagesToComplete } from '@121-service/test/helpers/program.helper';
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

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should succesfully block a Visa Debit card', async () => {
    // Arrange
    const testRegistration = {
      ...registrationVisa,
      referenceId: 'test-registration-visa--block-card',
      whatsappPhoneNumber: null, // Do not use WhatsApp for this test to avoid race conditions - our api test replies 'yes' on pending whatsapp message a bit too fast
    };
    await seedPaidRegistrations([testRegistration], programIdVisa);
    const visaWalletResponseBefore = await getVisaWalletsAndDetails(
      programIdVisa,
      testRegistration.referenceId,
      accessToken,
    );
    const tokencode = visaWalletResponseBefore.body.cards[0].tokenCode;

    // Act
    const blockVisaResponse = await blockVisaCard(
      programIdVisa,
      tokencode,
      accessToken,
      testRegistration.referenceId,
    );

    // Assert
    await waitForMessagesToComplete({
      programId: programIdVisa,
      referenceIds: [testRegistration.referenceId],
      accessToken,
      minimumNumberOfMessagesPerReferenceId: 2,
    });

    const visaWalletResponseAfter = await getVisaWalletsAndDetails(
      programIdVisa,
      testRegistration.referenceId,
      accessToken,
    );

    const messageResponse = await getMessageHistory(
      programIdVisa,
      testRegistration.referenceId,
      accessToken,
    );

    expect(blockVisaResponse.status).toBe(HttpStatus.OK);
    expect(visaWalletResponseAfter.body.cards[0].status).toBe(
      VisaCard121Status.Paused,
    );

    const messages = messageResponse.body.map(
      (message) => message.attributes.body,
    );
    expect(messages).toContain(
      messageTemplateNlrcOcw.pauseVisaCard?.message?.en,
    );
  });

  it('should succesfully unblock a Visa Debit card', async () => {
    // Arrange
    const testRegistration = {
      ...registrationVisa,
      referenceId: 'test-registration-visa--unblock-card',
      whatsappPhoneNumber: null, // Do not use WhatsApp for this test to avoid race conditions - our api test replies 'yes' on pending whatsapp message a bit too fast
    };
    await seedPaidRegistrations([testRegistration], programIdVisa);

    const visaWalletResponseBefore = await getVisaWalletsAndDetails(
      programIdVisa,
      testRegistration.referenceId,
      accessToken,
    );
    const tokencode = visaWalletResponseBefore.body.cards[0].tokenCode;

    await blockVisaCard(
      programIdVisa,
      tokencode,
      accessToken,
      testRegistration.referenceId,
    );

    // Act
    const unblockVisaResponse = await unblockVisaCard(
      programIdVisa,
      tokencode,
      accessToken,
      testRegistration.referenceId,
    );

    // Assert
    await waitForMessagesToComplete({
      programId: programIdVisa,
      referenceIds: [testRegistration.referenceId],
      accessToken,
      minimumNumberOfMessagesPerReferenceId: 3,
    });

    const visaWalletResponseAfter = await getVisaWalletsAndDetails(
      programIdVisa,
      testRegistration.referenceId,
      accessToken,
    );

    const messageResponse = await getMessageHistory(
      programIdVisa,
      testRegistration.referenceId,
      accessToken,
    );

    expect(unblockVisaResponse.status).toBe(HttpStatus.OK);
    expect(visaWalletResponseAfter.body.cards[0].status).not.toBe(
      VisaCard121Status.Blocked,
    );

    const messages = messageResponse.body.map(
      (message) => message.attributes.body,
    );
    expect(messages).toContain(
      messageTemplateNlrcOcw?.unpauseVisaCard?.message?.en,
    );
  });
});
