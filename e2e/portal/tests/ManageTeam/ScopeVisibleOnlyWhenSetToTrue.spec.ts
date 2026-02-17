import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
  });
});

test('"Scope" column should only be loaded when "enableScope": is set to true under the program configuration', async ({
  programTeamPage,
}) => {
  await test.step('Navigate to Manage team in PV program and validate scope column is hidden per configuration', async () => {
    await programTeamPage.goto('/program/2/settings/team');
    await programTeamPage.validateScopeColumnIsVisible();
  });

  await test.step('Navigate to Manage team in OCW program and validate scope column is hidden per configuration', async () => {
    await programTeamPage.goto('/program/3/settings/team');
    await programTeamPage.validateScopeColumnIsHidden();
  });
});
