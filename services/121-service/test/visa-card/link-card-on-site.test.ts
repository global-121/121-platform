import { IntersolveVisaWalletDto } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/dtos/internal/intersolve-visa-wallet.dto';
import { VisaCard121Status } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/wallet-status-121.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdVisa,
  registrationVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  getVisaWalletsAndDetails,
  linkVisaCardOnSite,
  seedIncludedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Link Visa debit card on site', () => {
  let accessToken: string;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  it('should successfully link a Visa Debit card on site', async () => {
    const tokenCode = '1111222233334444555';
    // Arrange
    await seedIncludedRegistrations(
      [registrationVisa],
      programIdVisa,
      accessToken,
    );

    // Act
    const response = await linkVisaCardOnSite({
      programId: programIdVisa,
      referenceId: registrationVisa.referenceId,
      accessToken,
      tokenCode,
    });
    await waitFor(3_000);

    const getVisaWalletResponse = await getVisaWalletsAndDetails(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );
    const parentWallet = getVisaWalletResponse.body as IntersolveVisaWalletDto;

    const card = parentWallet.cards[0];

    // Assert
    expect(response.status).toBe(201);

    expect(card.tokenCode).toBe(tokenCode);
    expect(card.status).toBe(VisaCard121Status.Active);
  });

  it('should throw when linking a Visa Debit card that is already linked', async () => {
    const tokenCode = '2222333344445555666';
    const uniqueRegistration = {
      ...registrationVisa,
      referenceId: 'unique-ref-id-1234',
    };
    // Arrange
    await seedIncludedRegistrations(
      [uniqueRegistration],
      programIdVisa,
      accessToken,
    );
    await waitFor(3_000);

    const getVisaWalletResponse = await getVisaWalletsAndDetails(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    // Act
    await linkVisaCardOnSite({
      programId: programIdVisa,
      referenceId: uniqueRegistration.referenceId,
      accessToken,
      tokenCode,
    });
    await waitFor(3_000);

    // Assert
    const response = await linkVisaCardOnSite({
      programId: programIdVisa,
      referenceId: uniqueRegistration.referenceId,
      accessToken,
      tokenCode,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Card is already linked to someone else.',
    );
    expect(getVisaWalletResponse.status).toBe(404);
  });

  it('should throw when linking a Visa Debit card that does not exist', async () => {
    const tokenCode = 'mock-fail-get-wallet';
    const uniqueRegistration = {
      ...registrationVisa,
      referenceId: 'unique-ref-id-2345',
    };
    // Arrange
    await seedIncludedRegistrations(
      [uniqueRegistration],
      programIdVisa,
      accessToken,
    );
    await waitFor(3_000);

    // Act
    await linkVisaCardOnSite({
      programId: programIdVisa,
      referenceId: uniqueRegistration.referenceId,
      accessToken,
      tokenCode,
    });
    await waitFor(3_000);

    // Assert
    const response = await linkVisaCardOnSite({
      programId: programIdVisa,
      referenceId: uniqueRegistration.referenceId,
      accessToken,
      tokenCode,
    });

    expect(response.status).toBe(400);
  });
});
