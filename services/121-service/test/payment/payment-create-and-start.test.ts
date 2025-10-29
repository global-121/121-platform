import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TwilioStatus } from '@121-service/src/notifications/dto/twilio.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { messageTemplateGeneric } from '@121-service/src/seed-data/message-template/message-template-generic.const';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  createPayment,
  getTransactions,
  startPayment,
  waitForMessagesToComplete,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  getMessageHistory,
  getRegistrationEvents,
  getRegistrations,
  importRegistrations,
  seedIncludedRegistrations,
  waitForRegistrationToHaveUpdatedPaymentCount,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
  registrationPV6,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Start and create a payment separately', () => {
  let accessToken: string;
  const programId = programIdPV;
  const transferValue = 25;
  const registrationAh = {
    referenceId: '63e62864557597e0b-AH',
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier: 1,
    nameFirst: 'John',
    nameLast: 'Smith',
    phoneNumber: '14155238886',
    programFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
    whatsappPhoneNumber: '14155238886',
    maxPayments: 1,
  };

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should set registration to complete on payment start when maxPayments is reached', async () => {
    // Arrange
    await seedIncludedRegistrations([registrationAh], programId, accessToken);
    const paymentReferenceIds = [registrationAh.referenceId];

    // Act 1 - create payment
    const createPaymentResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = createPaymentResponse.body.id;
    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 20_000,
      completeStatusses: [TransactionStatusEnum.created],
    });

    // Assert 1 - before starting payment
    const getTransactionsBeforeStartResponse = await getTransactions({
      programId,
      paymentId,
      registrationReferenceId: registrationAh.referenceId,
      accessToken,
    });
    const transactionsBeforeStart = getTransactionsBeforeStartResponse.body;

    const registrations = await getRegistrations({
      programId,
      accessToken,
      filter: {
        'filter.referenceId': registrationAh.referenceId,
      },
    });
    const registrationBeforeStart = registrations.body.data[0];

    expect(createPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(createPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(transactionsBeforeStart[0].status).toBe(
      TransactionStatusEnum.created,
    );
    expect(registrationBeforeStart!.status).toBe(
      RegistrationStatusEnum.included,
    );
    expect(registrationBeforeStart!.paymentCount).toBe(0);

    // Act 2 - start payment
    const startPaymentResponse = await startPayment({
      programId,
      paymentId,
      accessToken,
    });
    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 20_000,
    });

    // Assert 2 - after payment
    const getTransactionsAfterStartResponse = await getTransactions({
      programId,
      paymentId,
      registrationReferenceId: registrationAh.referenceId,
      accessToken,
    });
    const transactionsAfterStart = getTransactionsAfterStartResponse.body;
    // Wait for registration to be updated
    const registrationAfterStart =
      await waitForRegistrationToHaveUpdatedPaymentCount({
        programId,
        referenceId: registrationAh.referenceId,
        expectedPaymentCount: 1,
        accessToken,
      });
    expect(startPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(transactionsAfterStart[0].status).toBe(
      TransactionStatusEnum.success,
    );
    expect(transactionsAfterStart[0].errorMessage).toBe(null);

    expect(registrationAfterStart!.status).toBe(
      RegistrationStatusEnum.completed,
    );
    expect(registrationAfterStart!.paymentCountRemaining).toBe(0);
    expect(registrationAfterStart!.paymentCount).toBe(1);

    const statusChangeToCompleted = (
      await getRegistrationEvents({
        programId,
        accessToken,
        referenceId: registrationAh.referenceId,
      })
    ).body.filter(
      (event) => event.attributes.newValue === RegistrationStatusEnum.completed,
    );
    expect(statusChangeToCompleted.length).toBe(1);

    // Assert message sent
    const expectedMessageTranslations = Object.values(
      messageTemplateGeneric.completed.message ?? {},
    );

    await waitForMessagesToComplete({
      programId,
      referenceIds: paymentReferenceIds,
      accessToken,
      expectedMessageAttribute: {
        key: 'body',
        values: expectedMessageTranslations,
      },
    });

    const messageHistoryResponse = await getMessageHistory(
      programId,
      registrationAh.referenceId,
      accessToken,
    );

    const messageHistory = messageHistoryResponse.body;
    const expectedMessages = messageHistory.filter((message) =>
      expectedMessageTranslations.includes(message.attributes.body),
    );
    expect(expectedMessages.length).toBe(1);
    expect(expectedMessages[0].attributes.status).not.toBe(TwilioStatus.failed);
    expect(expectedMessages[0].attributes.contentType).toBe(
      MessageContentType.completed,
    );
  });

  it('should not start transactions of non-included registrations', async () => {
    // Arrange
    const registrations = [registrationPV5, registrationPV6];
    await importRegistrations(programId, registrations, accessToken);
    await awaitChangeRegistrationStatus({
      programId,
      referenceIds: registrations.map((r) => r.referenceId),
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    // only create, not start yet
    const createPaymentResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: registrations.map((r) => r.referenceId),
      accessToken,
    });
    const paymentId = createPaymentResponse.body.id;
    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds: registrations.map((r) => r.referenceId),
      accessToken,
      maxWaitTimeMs: 20_000,
      completeStatusses: [TransactionStatusEnum.created],
    });

    // Make one registration non-included
    await awaitChangeRegistrationStatus({
      programId,
      referenceIds: [registrationPV5.referenceId],
      status: RegistrationStatusEnum.declined,
      accessToken,
    });

    // Act
    await startPayment({
      programId,
      paymentId,
      accessToken,
    });
    await waitFor(1_000); // small wait to ensure transactions are started. We cannot listen for specific non-created statuses here as one should stay on created

    // Assert
    const getTransactionsResponse = await getTransactions({
      programId,
      paymentId,
      accessToken,
    });
    const transactions = getTransactionsResponse.body;

    const createdTransactions = transactions.filter(
      (t: any) => t.status === TransactionStatusEnum.created,
    );
    const nonCreatedTransactions = transactions.filter(
      (t: any) => t.status !== TransactionStatusEnum.created,
    );

    expect(createPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(createdTransactions.length).toBe(1);
    expect(nonCreatedTransactions.length).toBe(1);
  });
});
