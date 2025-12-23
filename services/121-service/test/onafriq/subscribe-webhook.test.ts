import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { subscribeWebhookOnafriq } from '@121-service/test/helpers/fsp-specific.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Subscribe webhook', () => {
  const programId = 1;
  let accessToken: string;

  it('should successfully subscribe webhook', async () => {
    // Arrange
    await resetDB(SeedScript.onafriqProgram, __filename);
    accessToken = await getAccessToken();

    // Act
    const response = await subscribeWebhookOnafriq(programId, accessToken);

    // Assert
    // This test only asserts the correct retrieval of programFspConfigProperties, as beyond that in mock-mode nothing happens
    expect(response.statusCode).toBe(HttpStatus.CREATED);
  });

  it('should fail when no onafriq program fsp config properties are found', async () => {
    // Arrange
    // Simulate this by loading another program
    await resetDB(SeedScript.safaricomProgram, __filename);
    accessToken = await getAccessToken();

    // Act
    const response = await subscribeWebhookOnafriq(programId, accessToken);

    // Assert
    expect(response.statusCode).toBe(404);
  });
});
