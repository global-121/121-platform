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
      .post(`/cronjob`)
      .set('Cookie', [accessToken]);

    // Assert
    expect(response.status).toBe(HttpStatus.NO_CONTENT);
  });
});
