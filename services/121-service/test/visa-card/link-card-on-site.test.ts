import { IntersolveVisaWalletDto } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/dtos/internal/intersolve-visa-wallet.dto';
import { VisaCard121Status } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/wallet-status-121.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdVisa,
  registrationVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { patchProgramFspConfigurationProperty } from '@121-service/test/helpers/program-fsp-configuration.helper';
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

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should successfully link a Visa Debit card on site', async () => {
    const tokenCode = '1111222233334444555';
    // Arrange
    await seedIncludedRegistrations(
      [registrationVisa],
      programIdVisa,
      accessToken,
    );

    await patchProgramFspConfigurationProperty({
      programId: programIdVisa,
      configName: Fsps.intersolveVisa,
      propertyName: FspConfigurationProperties.cardDistributionByMail,
      body: { value: 'false' },
      accessToken,
    });

    // Act
    const response = await linkVisaCardOnSite({
      programId: programIdVisa,
      referenceId: registrationVisa.referenceId,
      accessToken,
      tokenCode,
    });

    // TODO: do payment

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

    await patchProgramFspConfigurationProperty({
      programId: programIdVisa,
      configName: Fsps.intersolveVisa,
      propertyName: FspConfigurationProperties.cardDistributionByMail,
      body: { value: 'false' },
      accessToken,
    });

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

  fit('should throw when linking a Visa Debit card that does not exist', async () => {
    const tokenCode = '3333444455556666777';
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

    await patchProgramFspConfigurationProperty({
      programId: programIdVisa,
      configName: Fsps.intersolveVisa,
      propertyName: FspConfigurationProperties.cardDistributionByMail,
      body: { value: 'false' },
      accessToken,
    });

    // Act
    await linkVisaCardOnSite({
      programId: programIdVisa,
      referenceId: uniqueRegistration.referenceId,
      accessToken,
      tokenCode,
    });

    // Assert
    const response = await linkVisaCardOnSite({
      programId: programIdVisa,
      referenceId: uniqueRegistration.referenceId,
      accessToken,
      tokenCode,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      `Card with code ${tokenCode} is not found.`,
    );
  });

  it('should throw when card distribution by mail is disabled', async () => {
    const tokenCode = '5555666677778888999';
    const uniqueRegistration = {
      ...registrationVisa,
      referenceId: 'unique-ref-id-3456',
    };
    // Arrange
    await seedIncludedRegistrations(
      [uniqueRegistration],
      programIdVisa,
      accessToken,
    );

    await patchProgramFspConfigurationProperty({
      programId: programIdVisa,
      configName: Fsps.intersolveVisa,
      propertyName: FspConfigurationProperties.cardDistributionByMail,
      body: { value: 'true' },
      accessToken,
    });

    //act
    const response = await linkVisaCardOnSite({
      programId: programIdVisa,
      referenceId: uniqueRegistration.referenceId,
      accessToken,
      tokenCode,
    });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Linking a card on-site is not allowed when card distribution by mail is enabled.',
    );
  });
});
