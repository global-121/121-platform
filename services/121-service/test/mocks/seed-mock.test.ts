/* eslint-disable jest/no-conditional-expect */
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getVoucherBalance } from '@121-service/test/helpers/fsp-specific.helper';
import {
  getPayments,
  getTransactions,
} from '@121-service/test/helpers/program.helper';
import {
  getMessageHistory,
  getRegistrationEvents,
  getRegistrations,
  getVisaWalletsAndDetails,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Mock registrations', () => {
  let accessToken: string;

  beforeAll(async () => {
    // NOTE: without input parameters this endpoint applies 2 registration-duplications (so 4 registrations), 2 payments, and 1 message duplication
    const includeEvents = true;
    await resetDB(SeedScript.nlrcMultipleMock, __filename, includeEvents);
    accessToken = await getAccessToken();
  });

  it('should mock all data correctly for PV program', async () => {
    const programId = programIdPV;

    const registrationsResponse = await getRegistrations({
      programId,
      accessToken,
    });
    // Assert 4 registrations per program
    expect(registrationsResponse.body.data.length).toBe(4);

    // Assert unique phone numbers and whatsapp phone numbers
    const uniquePhoneNumbers = new Set(
      registrationsResponse.body.data.map((r) => r.phoneNumber),
    );
    const uniqueWhatsappPhoneNumbers = new Set(
      registrationsResponse.body.data.map((r) => r.whatsappPhoneNumber),
    );
    expect(uniquePhoneNumbers.size).toBe(4);
    expect(uniqueWhatsappPhoneNumbers.size).toBe(4);

    const paymentsResponse = await getPayments(programId, accessToken);
    for (const paymentData of paymentsResponse.body) {
      const paymentId = paymentData.paymentId;
      const transactionsResponse = await getTransactions({
        programId,
        paymentId,
        registrationReferenceId: null,
        accessToken,
      });

      // Assert 4 transactions per payment (one for each registration)
      expect(transactionsResponse.body.length).toBe(4);
      expect(transactionsResponse.text).toContain(
        TransactionStatusEnum.success,
      );

      for (const registration of registrationsResponse.body.data) {
        // Assert voucher balance call working, which implies correct data on intersolve-voucher and imagecode-export-voucher
        if (programId === programIdPV) {
          const voucherBalanceResponse = await getVoucherBalance(
            programId,
            paymentId,
            registration.referenceId,
            accessToken,
          );
          expect(voucherBalanceResponse.status).toBe(200);
        }
      }
    }

    for (const registration of registrationsResponse.body.data) {
      // Assert 5 (times 2) messages per registration
      const messageHistoryResponse = await getMessageHistory(
        programId,
        registration.referenceId,
        accessToken,
      );
      // TODO: this assertion is flaky, sometimes it yields 14 message instead of 10 for the PV registrations. Use a method similar to waitForMessagesToComplete after 1st payment.
      // const expected = 10;
      // expect(messageHistoryResponse.body.length).toBe(expected);
      // The following assertion is not flaky and does at least test that message extension across all registration & message duplication works
      expect(
        messageHistoryResponse.body.filter(
          (m) =>
            m.attributes.contentType === MessageContentType.paymentTemplated,
        ).length,
      ).toBe(2); // Assert 2 payment messages per registration
    }

    // Assert registration events are duplicated for all registrations
    const registrationIds = registrationsResponse.body.data.map((r) => r.id);
    const registrationEventsResponse = await getRegistrationEvents({
      programId,
      accessToken,
    });
    // There should be at least one event per registration, and the total should be a multiple of the number of registrations
    const events = registrationEventsResponse.body;
    const eventsByRegistration = registrationIds.map((id) =>
      events.filter((e) => e.registrationId === id),
    );
    // All registrations should have at least one event
    expect(eventsByRegistration.every((arr) => arr.length > 0)).toBe(true);
    // All events should belong to one of the registrations
    expect(
      events.every((e) => registrationIds.includes(e.registrationId)),
    ).toBe(true);

    // TODO: add more assertions on: paymentCount / duplicates / registrationData / sequenceNumbers / duplication-endpoint.
  });

  it('should additionally mock OCW-specific data correctly for OCW program', async () => {
    const programId = programIdOCW;

    const registrationsResponse = await getRegistrations({
      programId,
      accessToken,
    });

    // Assert Visa customer and wallet data being present for each registration
    for (const registration of registrationsResponse.body.data) {
      const visaData = await getVisaWalletsAndDetails(
        programId,
        registration.referenceId,
        accessToken,
      );
      expect(visaData.body.tokenCode).toBeDefined();
      expect(visaData.body.cards.length).toBe(1);
    }
  });
});
