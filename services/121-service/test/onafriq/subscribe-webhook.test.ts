import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  getServer,
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
    const response = await getServer()
      .post(`/fsps/onafriq/webhook/subscribe/programs/${programId}`)
      .set('Cookie', [accessToken])
      .send();

    // Assert
    // This test only asserts the correct retrieval of programFspConfigProperties, as beyond that in mock-mode nothing happens
    expect(response.statusCode).toBe(201);
  });

  it('should fail when no onafriq program fsp config properties are found', async () => {
    // Arrange
    // Simulate this by loading another program
    await resetDB(SeedScript.safaricomProgram, __filename);
    accessToken = await getAccessToken();

    // Act
    const response = await getServer()
      .post(`/fsps/onafriq/webhook/subscribe/programs/${programId}`)
      .set('Cookie', [accessToken])
      .send();

    // Assert
    expect(response.statusCode).toBe(404);
  });
});
