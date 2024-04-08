import { expect, test } from '@playwright/test';
import { SeedScript } from '../../../src/scripts/seed-script.enum';
import { importRegistrationsCSV } from '../../API/helpers/registration.helper';
import { getAccessToken, resetDB } from '../../API/helpers/utility.helper';

test('Should reset the Data Base to the required state', async ({ page }) => {
  const response = await resetDB(SeedScript.nlrcMultiple);
  expect(response.status).toBe(202);
});

test('Should upload registration from the file', async ({ page }) => {
  const programIdOcw = 3;
  const accessToken = await getAccessToken();
  await importRegistrationsCSV(
    programIdOcw,
    '../../test-registration-data/test-registrations-OCW.csv',
    accessToken,
  );
});
