import { HttpStatus } from '@nestjs/common';

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
      if (cronjob.responseStatus < 200 || cronjob.responseStatus >= 300) {
        throw new Error(
          `Failed to run Cron Job ${cronjob.methodName}. Status code: ${cronjob.responseStatus}`,
        );
      }
    }
  });
});
