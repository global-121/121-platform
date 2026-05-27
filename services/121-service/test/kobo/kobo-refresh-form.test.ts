import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { CreateKoboDto } from '@121-service/src/kobo/dtos/create-kobo.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { KoboMockAssetUids } from '@121-service/test/fixtures/kobo-mock-asset-uids';
import {
  refreshKoboForm,
  upsertKoboToProgram,
} from '@121-service/test/helpers/kobo.helper';
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

  it('should throw when no Kobo integration exists for the program', async () => {
    // Act
    const response = await refreshKoboForm({
      programId: programIdSafaricom,
      accessToken,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should successfully refresh an existing kobo integration', async () => {
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
});


