import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getServer } from '@121-service/test/helpers/utility.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';

describe('Development Controller - Indirect Relations Validation', () => {
  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
  });

  it('should validate indirect relation configuration successfully', async () => {
    const response = await getServer()
      .get('/development/validate-indirect-relations')
      .send();

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.status).toBe('success');
  });
});
