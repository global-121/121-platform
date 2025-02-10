import { HttpStatus } from '@nestjs/common';
import assert from 'assert';

import {
  getAccessToken,
  getServer,
} from '@121-service/test/helpers/utility.helper';

describe('Cron jobs', () => {
  let accessToken: string;

  beforeEach(async () => {
    accessToken = await getAccessToken();
  });

  it('should initiate all cronjobs succesfully', async () => {
    // Arrange

    // Act
    const response = await getServer()
      .patch(`/cronjob`)
      .set('Cookie', [accessToken]);

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
