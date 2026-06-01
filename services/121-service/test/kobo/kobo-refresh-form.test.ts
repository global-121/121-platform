import { HttpStatus } from '@nestjs/common';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { KoboMockAssetUids } from '@121-service/test/fixtures/kobo-mock-asset-uids';
import {
  refreshKoboForm,
  setupProgramWithKoboIntegration,
} from '@121-service/test/helpers/kobo.helper';
import {
  getProgram,
  patchProgram,
  postProgram,
} from '@121-service/test/helpers/program.helper';
import { postProgramFspConfiguration } from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

const fspConfiguration: CreateProgramFspConfigurationDto = {
  name: 'Safaricom',
  label: { en: 'Safaricom' },
  fspName: Fsps.safaricom,
  properties: [],
};

const baseProgram: Partial<CreateProgramDto> = {
  currency: CurrencyCode.EUR,
  enableMaxPayments: true,
  fixedTransferValue: 20,
  programRegistrationAttributes: [
    {
      name: FspAttributes.nationalId,
      label: { en: 'National ID' },
      type: RegistrationAttributeTypes.text,
      options: [],
    },
  ],
};

describe('Refresh Kobo form', () => {
  let accessToken: string;

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.productionInitialState });
    accessToken = await getAccessToken();
  });

  it('should throw when no Kobo integration exists for the program', async () => {
    // Arrange
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: { en: 'Program without Kobo integration' },
      languages: [RegistrationPreferredLanguage.en],
    } as CreateProgramDto;

    const createProgramResponse = await postProgram(program, accessToken);
    const programId = createProgramResponse.body.id;

    await postProgramFspConfiguration({
      programId,
      body: fspConfiguration,
      accessToken,
    });

    // Act
    const response = await refreshKoboForm({
      programId,
      accessToken,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should report no changes when the Kobo form is already up to date', async () => {
    // Arrange
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: { en: 'Program with Kobo integration' },
      languages: [RegistrationPreferredLanguage.en],
    } as CreateProgramDto;

    const { programId } = await setupProgramWithKoboIntegration({
      assetUid: KoboMockAssetUids.happyFlow,
      program,
      fspConfiguration,
      accessToken,
    });

    // Act
    const response = await refreshKoboForm({
      programId,
      accessToken,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject({
      message: 'Kobo form is already up to date',
      updated: false,
    });
  });

  it('should successfully refresh when the Kobo form has a new version', async () => {
    // Arrange: this mock asset returns a freshly randomized version_id on
    // every fetch, so the version stored at integration time will not match
    // the one returned by the refresh fetch.
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: { en: 'Program with stale Kobo integration' },
      languages: [RegistrationPreferredLanguage.en],
    } as CreateProgramDto;

    const { programId } = await setupProgramWithKoboIntegration({
      assetUid: KoboMockAssetUids.happyFlowAlwaysNewVersion,
      program,
      fspConfiguration,
      accessToken,
    });

    // Remove Dutch to prove refresh restores languages from the form definition.
    await patchProgram(
      programId,
      { languages: [RegistrationPreferredLanguage.en] },
      accessToken,
    );

    // Act
    const response = await refreshKoboForm({
      programId,
      accessToken,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject({
      message: 'Kobo form refreshed successfully',
      name: '25042025 Prototype Sprint',
      updated: true,
    });

    // Verify Dutch (nl) was added back from the Kobo form definition
    const programAfterRefresh = await getProgram(programId, accessToken);
    expect(programAfterRefresh.body.languages).toEqual(
      expect.arrayContaining([
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ]),
    );
  });
});


