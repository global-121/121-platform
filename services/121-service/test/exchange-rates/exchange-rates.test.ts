import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAllExchangeRates,
  retrieveAndStoreAllExchangeRates,
} from '@121-service/test/helpers/organization.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Exchange rates', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.safaricomProgram, __filename);
    accessToken = await getAccessToken();
  });

  it('get and retrieve exchange rates', async () => {
    // Arrange
    await retrieveAndStoreAllExchangeRates(accessToken);
    // Act
    const response = await getAllExchangeRates(accessToken);
    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    const firstExchangeRate = response.body[0];
    expect(firstExchangeRate.euroExchangeRate).toBe(0.00744368);
    expect(firstExchangeRate.currency).toBe('KES');
    expect(firstExchangeRate.closeTime).toBeDefined();
  });
});
