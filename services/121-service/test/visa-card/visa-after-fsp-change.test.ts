import { HttpStatus } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdVisa,
  registrationVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  retrieveAndUpdateVisaWalletsAndDetails,
  seedPaidRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Visa registration after FSP change', () => {
  let accessToken: string;

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  // When user update certain fields of a registration with a visa customer the 121-platform should update the visa customer with API calls to Intersolve
  // It's very hard to properly create automated tests for this functionality as the end result are API request to Intersolve.
  // When running API tests we have INTERSOLVE_MODE=MOCK in our env, which mean we make our API requests to our mock-service, which pretends to be Intersolve.
  // We have no way to easily validate if the mock service is properly called, so we only check if no errors are thrown when updating a registration with a visa customer.
  it('should get a success response when updating registration data of a registration with a visa customer', async () => {
    // Arrange
    const testRegistration = {
      ...registrationVisa,
      referenceId: 'test-visa-customer-update',
      whatsappPhoneNumber: registrationVisa.phoneNumber,
    };
    await seedPaidRegistrations({
      registrations: [testRegistration],
      programId: programIdVisa,
    });

    // Act
    const responseUpdateBeforeFspChange = await updateRegistration(
      programIdVisa,
      testRegistration.referenceId,
      {
        phoneNumber: '123456789',
      },
      'test',
      accessToken,
    );

    await updateRegistration(
      programIdVisa,
      testRegistration.referenceId,
      {
        programFspConfigurationName: 'Intersolve-voucher-whatsapp',
      },
      'test',
      accessToken,
    );

    // Even if a registrations FSP is changed, if a visa customer exists, the visa customer is still updated
    const responseUpdateAfterFspChange = await updateRegistration(
      programIdVisa,
      testRegistration.referenceId,
      {
        phoneNumber: '987654321',
      },
      'test',
      accessToken,
    );

    // Assert
    expect(responseUpdateBeforeFspChange.status).toBe(HttpStatus.OK);
    expect(responseUpdateAfterFspChange.status).toBe(HttpStatus.OK);
  });

  it('should load wallet without maxToSpendPerMonth after FSP is changed to voucher', async () => {
    // Arrange
    const testRegistration = {
      ...registrationVisa,
      referenceId: 'test-visa-wallet-after-fsp-change',
      whatsappPhoneNumber: registrationVisa.phoneNumber,
    };
    await seedPaidRegistrations({
      registrations: [testRegistration],
      programId: programIdVisa,
      completeStatuses: [TransactionStatusEnum.success],
    });

    // Verify wallet loads with maxToSpendPerMonth before FSP change
    const walletBeforeFspChange = await retrieveAndUpdateVisaWalletsAndDetails(
      programIdVisa,
      testRegistration.referenceId,
      accessToken,
    );

    // Act: change FSP from Intersolve Visa to Intersolve Voucher WhatsApp
    await updateRegistration(
      programIdVisa,
      testRegistration.referenceId,
      {
        programFspConfigurationName: 'Intersolve-voucher-whatsapp',
      },
      'switching FSP away from visa',
      accessToken,
    );

    // Assert:
    expect(walletBeforeFspChange.status).toBe(HttpStatus.OK);

    // wallet should still load but without maxToSpendPerMonth
    const walletAfterFspChange = await retrieveAndUpdateVisaWalletsAndDetails(
      programIdVisa,
      testRegistration.referenceId,
      accessToken,
    );
    expect(walletAfterFspChange.status).toBe(HttpStatus.OK);

    const {
      maxToSpendPerMonth: maxBalanceBefore,
      lastUsedDate: _lastUsedBefore,
      lastExternalUpdate: _lastExtBefore,
      ...walletBefore
    } = walletBeforeFspChange.body;
    const {
      maxToSpendPerMonth: maxBalanceAfter,
      lastUsedDate: _lastUsedAfter,
      lastExternalUpdate: _lastExtAfter,
      ...walletAfter
    } = walletAfterFspChange.body;

    expect(maxBalanceBefore).toBeDefined();
    expect(maxBalanceAfter).toBeUndefined();
    expect(walletAfter).toEqual(walletBefore);
  });
});
