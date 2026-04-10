import { HttpStatus } from '@nestjs/common';

import { IntersolveVisaCardStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-status.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdVisa,
  registrationVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import {
  closeVisaCard,
  deleteRegistrations,
  getVisaWalletClosuresExport,
  getVisaWalletsAndDetails,
  seedPaidRegistrations,
  waitForDeleteRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Close visa debit card', () => {
  let accessToken: string;

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessToken = await getAccessToken();
  });

  it('should successfully close a Visa Debit card and book back balance', async () => {
    // Arrange
    const testRegistration = {
      ...registrationVisa,
      referenceId: 'test-registration-visa--close-card',
      whatsappPhoneNumber: null,
    };
    await seedPaidRegistrations({
      registrations: [testRegistration],
      programId: programIdVisa,
      completeStatuses: [TransactionStatusEnum.success],
    });

    const walletResponseBefore = await getVisaWalletsAndDetails(
      programIdVisa,
      testRegistration.referenceId,
      accessToken,
    );
    const tokenCode = walletResponseBefore.body.cards[0].tokenCode;

    // Act
    const closeResponse = await closeVisaCard({
      programId: programIdVisa,
      referenceId: testRegistration.referenceId,
      tokenCode,
      accessToken,
    });

    // Assert
    expect(closeResponse.status).toBe(HttpStatus.NO_CONTENT);

    const walletResponseAfter = await getVisaWalletsAndDetails(
      programIdVisa,
      testRegistration.referenceId,
      accessToken,
    );

    const closedCard = walletResponseAfter.body.cards.find(
      (card) => card.tokenCode === tokenCode,
    );
    expect(closedCard.debugInformation.intersolveVisaCardStatus).toBe(
      IntersolveVisaCardStatus.CardClosed,
    );

    const exportResponse = await getVisaWalletClosuresExport({
      programId: programIdVisa,
      accessToken,
    });
    expect(exportResponse.status).toBe(HttpStatus.OK);

    expect(exportResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cardNumber: tokenCode,
          referenceId: testRegistration.referenceId,
          amountBookedBack: 25,
          closedDate: expect.any(String),
        }),
      ]),
    );
  });

  it('should preserve wallet closure record after registration is deleted', async () => {
    // Arrange
    const testRegistration = {
      ...registrationVisa,
      referenceId: 'test-registration-visa--close-card-then-delete',
      whatsappPhoneNumber: null,
    };
    await seedPaidRegistrations({
      registrations: [testRegistration],
      programId: programIdVisa,
      completeStatuses: [TransactionStatusEnum.success],
    });

    const walletResponse = await getVisaWalletsAndDetails(
      programIdVisa,
      testRegistration.referenceId,
      accessToken,
    );
    const tokenCode = walletResponse.body.cards[0].tokenCode;

    await closeVisaCard({
      programId: programIdVisa,
      referenceId: testRegistration.referenceId,
      tokenCode,
      accessToken,
    });

    // Act
    await deleteRegistrations({
      programId: programIdVisa,
      referenceIds: [testRegistration.referenceId],
      accessToken,
      reason: 'test cleanup',
    });
    await waitForDeleteRegistrations({
      programId: programIdVisa,
      referenceIds: [testRegistration.referenceId],
    });

    // Assert
    const exportResponse = await getVisaWalletClosuresExport({
      programId: programIdVisa,
      accessToken,
    });
    expect(exportResponse.status).toBe(HttpStatus.OK);
    expect(exportResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cardNumber: tokenCode,
          referenceId: testRegistration.referenceId, // Reference ID should still be present even after registration is deleted (just all PII is removed from the registration, but reference ID is not considered PII)
          amountBookedBack: 25,
          closedDate: expect.any(String),
        }),
      ]),
    );
  });

  it('should return an error when the Intersolve API fails during close card', async () => {
    // Arrange
    const testRegistration = {
      ...registrationVisa,
      referenceId: 'test-registration-visa--close-card-fail',
      fullName: 'mock-fail-close-card',
      whatsappPhoneNumber: null,
    };
    await seedPaidRegistrations({
      registrations: [testRegistration],
      programId: programIdVisa,
      completeStatuses: [TransactionStatusEnum.success],
    });

    const walletResponse = await getVisaWalletsAndDetails(
      programIdVisa,
      testRegistration.referenceId,
      accessToken,
    );
    const tokenCode = walletResponse.body.cards[0].tokenCode;

    // Act
    const closeResponse = await closeVisaCard({
      programId: programIdVisa,
      referenceId: testRegistration.referenceId,
      tokenCode,
      accessToken,
    });

    // Assert
    expect(closeResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(closeResponse.body.message).toMatchInlineSnapshot(
      `"CLOSE CARD ERROR: UNEXPECTED_ERROR: We mocked that changing card status failed unexpectedly Field: tokenCode"`,
    );
  });
});
