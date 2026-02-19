import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const newUSerFullName = 'New User';
const newUserEmail = 'email@example.example';

test.beforeEach('Setup', async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.testMultiple,
    skipSeedRegistrations: true,
  });
});

test('[Admin] Add a user', async ({ usersPage }) => {
  await test.step('Add user new user', async () => {
    await usersPage.navigateToPage('Users');
    await usersPage.addNewUser({
      fullName: newUSerFullName,
      email: newUserEmail,
    });
    await usersPage.validateNewUserAdded({
      fullName: newUSerFullName,
      email: newUserEmail,
    });
  });
});
