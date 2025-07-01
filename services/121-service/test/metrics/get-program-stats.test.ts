import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

describe('Get program stats', () => {
  let accessToken: string;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultipleMock, __filename);

    accessToken = await getAccessToken();
  });

  it('should successfully get program stats', async () => {
    //Act
    const getProgramStatsResponse = await getServer()
      .get(`/programs/${programIdOCW}/metrics/program-stats-summary`)
      .set('Cookie', [accessToken])
      .send();

    //Assert
    expect(getProgramStatsResponse.statusCode).toBe(200);
    expect(getProgramStatsResponse.body).toMatchSnapshot();
  });
});
