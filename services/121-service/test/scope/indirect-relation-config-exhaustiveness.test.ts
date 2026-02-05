import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  getServer,
} from '@121-service/test/helpers/utility.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';

describe('Test Controller - Indirect Relations Validation', () => {
  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
  });

  // This test checks if indirectRelationConfig (in scoped.repository.ts) is exhaustive, as it is hard to maintain this manually over time.
  // It is done via API-test instead of unit-test, because it was not possible as it requires the database to be set up.
  // If this test fails, then update the indirectRelationConfig with the missing relations from the test output.
  it('should validate indirect relation configuration successfully', async () => {
    const accessToken = await getAccessToken();
    const response = await getServer()
      .get('/test/validate-indirect-relations')
      .set('Cookie', [accessToken])
      .send();

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body).toStrictEqual([]); // no missing relations expected
  });
});
