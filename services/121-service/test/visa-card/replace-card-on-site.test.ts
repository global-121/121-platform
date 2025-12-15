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
  replaceVisaCardOnSite,
  seedIncludedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Replace Visa debit card on site', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should successfully replace a card on-site', async () => {
    // Arrange
    const linkedTokenCode = '9999888877776666555';
    const replaceTokenCode = '8888777766665555444';
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

    await linkVisaCardOnSite({
      programId: programIdVisa,
      referenceId: registrationVisa.referenceId,
      accessToken,
      tokenCode: linkedTokenCode,
    });

    // Act
    const replaceCardResponse = await replaceVisaCardOnSite({
      programId: programIdVisa,
      referenceId: registrationVisa.referenceId,
      accessToken,
      tokenCode: replaceTokenCode,
    });

    const walletResponse = await getVisaWalletsAndDetails(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );
    const parentWallet = walletResponse.body as IntersolveVisaWalletDto;

    const card = parentWallet.cards[0];

    // Assert
    expect(replaceCardResponse.status).toBe(201);
    expect(walletResponse.status).toBe(200);

    expect(card.tokenCode).toBe(replaceTokenCode);
    expect(card.status).toBe(VisaCard121Status.Active);
  });

  it('should throw when card distribution by mail is enabled', async () => {
    // Arrange
    const tokenCode = '7777666655554444333';
    const registration = {
      ...registrationVisa,
      referenceId: 'replace-on-site-mail-enabled',
    };

    await seedIncludedRegistrations([registration], programIdVisa, accessToken);

    await patchProgramFspConfigurationProperty({
      programId: programIdVisa,
      configName: Fsps.intersolveVisa,
      propertyName: FspConfigurationProperties.cardDistributionByMail,
      body: { value: 'true' },
      accessToken,
    });

    // Act
    const response = await replaceVisaCardOnSite({
      programId: programIdVisa,
      referenceId: registration.referenceId,
      accessToken,
      tokenCode,
    });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Replacing a card on-site is not allowed when card distribution by mail is enabled.',
    );
  });

  it('should throw when card does not exist', async () => {
    // Arrange
    const linkedTokenCode = '6666555544443333222';
    const replaceTokenCode = '3333444455556666777'; //mock non-existent token code
    const registration = {
      ...registrationVisa,
      referenceId: 'replace-on-site-card-not-exist',
    };

    await seedIncludedRegistrations([registration], programIdVisa, accessToken);

    await patchProgramFspConfigurationProperty({
      programId: programIdVisa,
      configName: Fsps.intersolveVisa,
      propertyName: FspConfigurationProperties.cardDistributionByMail,
      body: { value: 'false' },
      accessToken,
    });

    await linkVisaCardOnSite({
      programId: programIdVisa,
      referenceId: registration.referenceId,
      accessToken,
      tokenCode: linkedTokenCode,
    });

    // Act
    const response = await replaceVisaCardOnSite({
      programId: programIdVisa,
      referenceId: registration.referenceId,
      accessToken,
      tokenCode: replaceTokenCode,
    });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      `Card with code ${replaceTokenCode} is not found.`,
    );
  });

  it('should throw when registration has no card to replace', async () => {
    // Arrange
    const replaceTokenCode = '4444333322221111000';
    const registration = {
      ...registrationVisa,
      referenceId: 'replace-on-site-no-customer',
    };

    await seedIncludedRegistrations([registration], programIdVisa, accessToken);

    await patchProgramFspConfigurationProperty({
      programId: programIdVisa,
      configName: Fsps.intersolveVisa,
      propertyName: FspConfigurationProperties.cardDistributionByMail,
      body: { value: 'false' },
      accessToken,
    });

    const response = await replaceVisaCardOnSite({
      programId: programIdVisa,
      referenceId: registration.referenceId,
      accessToken,
      tokenCode: replaceTokenCode,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Cannot replace a card for a registration which has no cards linked.',
    );
  });
});
//
