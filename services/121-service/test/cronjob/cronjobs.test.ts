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
    // Loop over the array in the response body and check if the responseStatus is between 200 and 300. If not, throw an error.
    for (const cronjob of response.body) {
      if (cronjob.responseStatus < 200 || cronjob.responseStatus >= 300) {
        throw new Error(
          `Failed to run Cron Job ${cronjob.methodName}. Status code: ${cronjob.responseStatus}`,
        );
      }
    }

    // if (response.status < 200 || response.status >= 300) {
    //   throw new Error(
    //     `Failed to run Cron Job cronCancelByRefposIntersolve. Status code: ${response.status}`,
    //   );
    // }
  });
});
