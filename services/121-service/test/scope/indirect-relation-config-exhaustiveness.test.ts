import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getServer } from '@121-service/test/helpers/utility.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';

describe('Development Controller - Indirect Relations Validation', () => {
  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
  });

  // This test checks if indirectRelationConfig (in scoped.repository.ts) is exhaustive, as it is hard to maintain this manually over time.
  // It is done via API-test instead of unit-test, because it was not possible to it requires the database to be set up.
  // If this test fails, then you can find more details on missing details in the 121-service logs, which can be used to update the indirectRelationConfig.
  it('should validate indirect relation configuration successfully', async () => {
    const response = await getServer()
      .get('/development/validate-indirect-relations')
      .send();

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.status).toBe('success');
  });
});
