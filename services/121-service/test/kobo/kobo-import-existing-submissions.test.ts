import { HttpStatus } from '@nestjs/common';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { KoboMockSubmissionUuids } from '@121-service/test/fixtures/kobo-mock-submission-uuids';
import {
  importKoboSubmissionsForProgram,
  setupProgramWithKoboIntegration,
} from '@121-service/test/helpers/kobo.helper';
import { searchRegistrationByReferenceId } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

const createProgramFspConfigurationSafaricomDto: CreateProgramFspConfigurationDto =
  {
    name: 'Safaricom',
    label: {
      en: 'Safaricom',
    },
    fspName: Fsps.safaricom,
    properties: [],
  };

const requiredProgramRegistrationAttributesForSafaricom = [
  {
    name: FspAttributes.nationalId,
    label: {
      en: 'National ID',
    },
    type: RegistrationAttributeTypes.text,
    options: [],
  },
];

const baseProgram: Partial<CreateProgramDto> = {
  currency: CurrencyCode.EUR,
  enableMaxPayments: true,
  fixedTransferValue: 20,
  programRegistrationAttributes:
    requiredProgramRegistrationAttributesForSafaricom,
};

describe('Import existing Kobo submissions', () => {
  let accessToken: string;

  beforeAll(async () => {
    await resetDB(SeedScript.productionInitialState, __filename);
    accessToken = await getAccessToken();
  });

  async function setup(): Promise<{
    programId: number;
    assetUid: string;
  }> {
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: {
        en: 'Program with Kobo integration for import testing',
      },
      languages: [RegistrationPreferredLanguage.en],
    } as CreateProgramDto;

    return setupProgramWithKoboIntegration({
      assetUid: 'import-existing-test-asset',
      program,
      fspConfiguration: createProgramFspConfigurationSafaricomDto,
      accessToken,
    });
  }

  it('should successfully import existing Kobo submissions and create registrations', async () => {
    // Arrange
    const { programId } = await setup();

    // Act
    const importResponse = await importKoboSubmissionsForProgram({
      programId,
      accessToken,
    });

    // Assert
    expect(importResponse.status).toBe(HttpStatus.CREATED);
    expect(importResponse.body).toMatchObject({
      countImported: 1,
    });

    // Verify the registration was created using the submission UUID from mock data
    const searchResponse = await searchRegistrationByReferenceId(
      KoboMockSubmissionUuids.success,
      programId,
      accessToken,
    );
    expect(searchResponse.body.data).toBeArrayOfSize(1);
    expect(searchResponse.body.data[0]).toMatchObject({
      referenceId: KoboMockSubmissionUuids.success,
      fullName: 'John Doe',
      nationalId: '123456789',
      phoneNumber: '+31612345678',
    });
  });

  it('should return 404 when no Kobo integration is found for the program', async () => {
    // Arrange: use a non-existent program ID
    const nonExistentProgramId = 999999;

    // Act
    const importResponse = await importKoboSubmissionsForProgram({
      programId: nonExistentProgramId,
      accessToken,
    });

    // Assert
    expect(importResponse.status).toBe(HttpStatus.NOT_FOUND);
  });
});
