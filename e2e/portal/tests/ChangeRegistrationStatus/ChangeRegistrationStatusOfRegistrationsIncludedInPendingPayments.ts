import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationPV5,
  registrationPV6,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.describe('xxx', () => {
  test.beforeAll(async ({ onlyResetAndSeedRegistrations }) => {
    await onlyResetAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: [registrationPV5, registrationPV6],
      programId: programIdPV,
    });
  });
});
