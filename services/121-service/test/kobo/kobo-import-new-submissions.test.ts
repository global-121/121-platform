import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { CreateKoboDto } from '@121-service/src/kobo/dtos/create-kobo.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { KoboMockSubmissionUuids } from '@121-service/test/fixtures/kobo-mock-submission-uuids';
import {
  patchKoboSubmissions,
  postKoboToProgram,
} from '@121-service/test/helpers/kobo.helper';
import { searchRegistrationByReferenceId } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

// The safaricomProgram seed creates program ID 1 with fullName, nationalId,
// phoneNumber attributes and a Safaricom FSP configuration — everything the
// mock Kobo submission data requires.
const programId = 1;
const assetUid = 'import-test-asset';
const expectedReferenceId = `${KoboMockSubmissionUuids.success}-${assetUid}`;

describe('Import new Kobo submissions via PATCH endpoint', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.safaricomProgram, __filename);
    accessToken = await getAccessToken();
  });

  async function linkKoboToProgram(): Promise<void> {
    const koboLinkDto: CreateKoboDto = {
      token: 'mock-token',
      assetUid,
      url: `${env.MOCK_SERVICE_URL}/api/kobo`,
    };

    await postKoboToProgram({
      programId,
      body: koboLinkDto,
      accessToken,
      dryRun: false,
    });
  }

  it('should import new submissions and create registrations', async () => {
    // Arrange
    await linkKoboToProgram();

    // Act
    const response = await patchKoboSubmissions({ programId, accessToken });

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.aggregateImportResult.countImported).toBe(1);

    const searchResponse = await searchRegistrationByReferenceId(
      expectedReferenceId,
      programId,
      accessToken,
    );
    expect(searchResponse.body.data).toBeArrayOfSize(1);
    expect(searchResponse.body.data[0]).toMatchObject({
      referenceId: expectedReferenceId,
      fullName: 'John Doe',
      nationalId: '123456789',
      phoneNumber: '+31612345678',
    });
  });

  it('should not import submissions that already exist', async () => {
    // Arrange
    await linkKoboToProgram();
    const firstResponse = await patchKoboSubmissions({
      programId,
      accessToken,
    });
    expect(firstResponse.status).toBe(HttpStatus.OK);
    expect(firstResponse.body.aggregateImportResult.countImported).toBe(1);

    // Act: Import a second time — the same submission already exists
    const secondResponse = await patchKoboSubmissions({
      programId,
      accessToken,
    });

    // Assert
    expect(secondResponse.status).toBe(HttpStatus.OK);
    expect(secondResponse.body.aggregateImportResult.countImported).toBe(0);

    const searchResponse = await searchRegistrationByReferenceId(
      expectedReferenceId,
      programId,
      accessToken,
    );
    expect(searchResponse.body.data).toBeArrayOfSize(1);
  });
});
