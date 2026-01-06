import { IntersolveVisaCardStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-status.enum';
import { VisaCard121Status } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/wallet-status-121.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdVisa,
  registrationVisa,
  transferValueVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  createAndStartPayment,
  waitForPaymentAndTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  getVisaWalletsAndDetails,
  importRegistrations,
  replaceVisaCardByMail,
  retrieveAndUpdateVisaWalletsAndDetails,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

// This test takes a lot of time because there are my statuses to check
jest.setTimeout(40_000);

describe('Load Visa debit cards and details', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  it('should successfully show a Visa Debit card', async () => {
    const registrations = [registrationVisa];
    for (const status of Object.values(IntersolveVisaCardStatus)) {
      const copyRegistration = {
        ...registrationVisa,
        lastName: `mock-fail-get-card-${status}`,
        referenceId: `${registrationVisa.referenceId}-${status}`,
        whatsappPhoneNumber: registrationVisa.phoneNumber,
      };
      registrations.push(copyRegistration);
    }
    const referenceIds = registrations.map(
      (registration) => registration.referenceId,
    );
    await importRegistrations(programIdVisa, registrations, accessToken);
    await awaitChangeRegistrationStatus({
      programId: programIdVisa,
      referenceIds,
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    await createAndStartPayment({
      programId: programIdVisa,
      transferValue: transferValueVisa,
      referenceIds,
      accessToken,
    });

    // Act
    await waitForPaymentAndTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds: referenceIds,
      accessToken,
      maxWaitTimeMs: 30_000,
    });
    for (const registration of registrations) {
      await replaceVisaCardByMail(
        programIdVisa,
        registration.referenceId,
        accessToken,
      );

      const visaParentWalletResponse =
        await retrieveAndUpdateVisaWalletsAndDetails(
          programIdVisa,
          registration.referenceId,
          accessToken,
        );

      // Assert
      expect(visaParentWalletResponse.status).toBe(200);
      expect(visaParentWalletResponse.body.cards).toBeDefined();
      expect(visaParentWalletResponse.body.cards.length).toBe(2);
      expect(visaParentWalletResponse.body.balance).toBeDefined();
      expect(visaParentWalletResponse.body.balance).toBe(
        transferValueVisa * 100,
      );
      expect(visaParentWalletResponse.body.lastUsedDate).toBeDefined();
      expect(visaParentWalletResponse.body.spentThisMonth).toBeDefined();
      const sortedCards = visaParentWalletResponse.body.cards.sort(
        (a, b) => a.issuedDate - b.issuedDate,
      );
      for (const [index, card] of sortedCards.entries()) {
        if (index === 1) {
          // eslint-disable-next-line jest/no-conditional-expect -- Only the first card has no actions (TODO: Could be rewritten unconditionally probably)
          expect(card.actions.length).toBe(0);
        } else {
          // eslint-disable-next-line jest/no-conditional-expect -- Only the first card has no actions (TODO: Could be rewritten unconditionally probably)
          expect(card.actions.length).toBeGreaterThan(0);
        }
        expect(card.tokenCode).toBeDefined();
        expect(Object.values(VisaCard121Status)).toContain(card.status);
        expect(card.status).not.toBe(VisaCard121Status.Unknown);
        expect(card.issuedDate).toBeDefined();
      }
    }
  });

  it('should throw a 404 if wallet or registration does not exist', async () => {
    const registrations = [registrationVisa];
    await importRegistrations(programIdVisa, registrations, accessToken);
    const referenceIds = registrations.map(
      (registration) => registration.referenceId,
    );
    await awaitChangeRegistrationStatus({
      programId: programIdVisa,
      referenceIds,
      status: RegistrationStatusEnum.included,
      accessToken,
    });

    // Act
    const unknownResponse = await getVisaWalletsAndDetails(
      programIdVisa,
      'unknown-reference-id',
      accessToken,
    );
    const noCustomerReponse = await getVisaWalletsAndDetails(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    // Assert
    expect(unknownResponse.status).toBe(404);
    expect(noCustomerReponse.status).toBe(404);
  });
});
