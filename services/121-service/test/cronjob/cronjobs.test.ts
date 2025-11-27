import { HttpStatus } from '@nestjs/common';
import assert from 'node:assert';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  getAccessToken,
  getServer,
} from '@121-service/test/helpers/utility.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
describe('Cron jobs', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  it('should initiate all cronjobs successfully', async () => {
    // Arrange

    // Act
    const response = await getServer()
      .set('Cookie', [accessToken])
      .patch(`/cronjobs`);

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    for (const cronjob of response.body) {
      assert(
        cronjob.responseStatus >= 200 && cronjob.responseStatus < 300,
        `Expected responseStatus to be between 200 and 299, but received ${cronjob.responseStatus} for cronjob: ${JSON.stringify(cronjob)}`,
      );
    }
  });
});
