import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { CreateKoboDto } from '@121-service/src/kobo/dtos/create-kobo.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { KoboMockAssetUids } from '@121-service/test/fixtures/kobo-mock-asset-uids';
import {
  getKoboFromProgram,
  refreshKoboForm,
  upsertKoboToProgram,
} from '@121-service/test/helpers/kobo.helper';
import { getProgram } from '@121-service/test/helpers/program.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdSafaricom } from '@121-service/test/registrations/pagination/pagination-data';

const koboLinkDto: CreateKoboDto = {
  token: 'mock-token',
  assetUid: KoboMockAssetUids.happyFlow,
  url: `${env.MOCK_SERVICE_URL}/api/kobo`,
};

describe('Refresh Kobo form', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB({ seedScript: SeedScript.safaricomProgram });
    accessToken = await getAccessToken();
  });

  it('should return 404 when no Kobo integration exists for the program', async () => {
    // Act
    const response = await refreshKoboForm({
      programId: programIdSafaricom,
      accessToken,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should return 200 with form name when Kobo integration exists', async () => {
    // Arrange
    await upsertKoboToProgram({
      programId: programIdSafaricom,
      body: koboLinkDto,
      accessToken,
      dryRun: false,
    });

    // Act
    const response = await refreshKoboForm({
      programId: programIdSafaricom,
      accessToken,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject({
      message: 'Kobo form refreshed successfully',
      name: '25042025 Prototype Sprint',
    });
  });

  it('should update program attributes and languages when refreshed with an updated Kobo form', async () => {
    // Arrange – integrate with the updated form (adds a new attribute and French language)
    await upsertKoboToProgram({
      programId: programIdSafaricom,
      body: {
        ...koboLinkDto,
        assetUid: KoboMockAssetUids.happyFlowWithChanges,
      },
      accessToken,
      dryRun: false,
    });

    const koboBefore = (
      await getKoboFromProgram({ programId: programIdSafaricom, accessToken })
    ).body;
    expect(koboBefore.versionId).toBe(KoboMockAssetUids.happyFlowWithChanges);

    // Act – refresh should re-fetch and re-apply the updated form
    const response = await refreshKoboForm({
      programId: programIdSafaricom,
      accessToken,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.OK);

    const programAfter = (
      await getProgram(programIdSafaricom, accessToken)
    ).body;
    const attributeNamesAfter = programAfter.programRegistrationAttributes.map(
      (attr: { name: string }) => attr.name,
    );
    expect(attributeNamesAfter).toContain('newAttribute');
    expect(programAfter.languages).toContain(RegistrationPreferredLanguage.fr);
  });
});


