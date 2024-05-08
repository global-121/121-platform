import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-wallet.entity';
/* eslint-disable jest/no-conditional-expect */
import {
  amountVisa,
  paymentNrVisa,
  programIdVisa,
  registrationVisa,
} from '@121-service/seed-data/mock/visa-card.data';
import { WalletCardStatus121 } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  doPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangePaStatus,
  getVisaWalletsAndDetails,
  importRegistrations,
  issueNewVisaCard,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

// This test takes a lot of time because there are my statusses to check
jest.setTimeout(40_000);

describe('Load Visa debit cards and details', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  it('should succesfully show a Visa Debit card', async () => {
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
    await awaitChangePaStatus(
      programIdVisa,
      referenceIds,
      RegistrationStatusEnum.included,
      accessToken,
    );
    await doPayment(
      programIdVisa,
      paymentNrVisa,
      amountVisa,
      referenceIds,
      accessToken,
    );

    // Act
    await waitForPaymentTransactionsToComplete(
      programIdVisa,
      referenceIds,
      accessToken,
      30_000,
    );
    for (const registration of registrations) {
      await issueNewVisaCard(
        programIdVisa,
        registration.referenceId,
        accessToken,
      );

      const visaWalletResponse = await getVisaWalletsAndDetails(
        programIdVisa,
        registration.referenceId,
        accessToken,
      );

      // Assert
      expect(visaWalletResponse.status).toBe(200);
      expect(visaWalletResponse.body.wallets).toBeDefined();
      expect(visaWalletResponse.body.wallets.length).toBe(2);
      const sortedWallets = visaWalletResponse.body.wallets.sort(
        (a, b) => a.issuedDate - b.issuedDate,
      );
      for (const [index, wallet] of sortedWallets.entries()) {
        if (index === 1) {
          expect(wallet.links.length).toBe(0);
        } else {
          expect(wallet.links.length).toBeGreaterThan(0);
        }
        expect(wallet.tokenCode).toBeDefined();
        expect(wallet.balance).toBeDefined();
        expect(wallet.balance).toBe(amountVisa * 100);
        expect(Object.values(WalletCardStatus121)).toContain(wallet.status);
        expect(wallet.status).not.toBe(WalletCardStatus121.Unknown);
        expect(wallet.issuedDate).toBeDefined();
        expect(wallet.lastUsedDate).toBeDefined();
        expect(wallet.spentThisMonth).toBeDefined();
      }
    }
  });

  it('should throw a 404 if wallet or registration does not exist', async () => {
    const registrations = [registrationVisa];
    await importRegistrations(programIdVisa, registrations, accessToken);
    const referenceIds = registrations.map(
      (registration) => registration.referenceId,
    );
    await awaitChangePaStatus(
      programIdVisa,
      referenceIds,
      RegistrationStatusEnum.included,
      accessToken,
    );

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
