import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getRegistrationIdByReferenceId } from '@121-service/test/helpers/registration.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const programId = 2;
let registrationId: number;

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationPV5],
    programId: programIdPV,
  });

  const accessToken = await getAccessToken();

  registrationId = await getRegistrationIdByReferenceId({
    programId: programIdPV,
    referenceId: registrationPV5.referenceId,
    accessToken,
  });
});

test('User can initiate registration status changes from registration page', async ({
  registrationActivityLogPage,
}) => {
  const statusChangeActions = ['Validate', 'Include', 'Decline', 'Delete'];

  for (const actionName of statusChangeActions) {
    await test.step('Navigate to registration', async () => {
      await registrationActivityLogPage.goto(
        `/program/${programId}/registrations/${registrationId}`,
      );
    });

    // @TODO: Maybe it's just me, but why are we only testing the dialog,
    // and not asserting if the dialog form actually works?

    await test.step(`Initiate action: ${actionName}`, async () => {
      await registrationActivityLogPage.initiateAction(actionName);
      await registrationActivityLogPage.validateDialogContent({
        title: `${actionName} registration(s)`,
        content: `You're about to ${actionName.toLowerCase()} 1 registrations.`,
      });
    });
  }
});

test('User can open add note sidebar from action menu', async ({
  registrationActivityLogPage,
}) => {
  const actionName = 'Add note';

  await test.step('Navigate to registration', async () => {
    await registrationActivityLogPage.goto(
      `/program/${programId}/registrations/${registrationId}`,
    );
  });

  await test.step(`Initiate action: ${actionName}`, async () => {
    await registrationActivityLogPage.initiateAction(actionName);
    await registrationActivityLogPage.validateDialogContent({
      content: `You are about to add a note to ${registrationPV5.fullName}'s profile. `,
    });
  });
});

test('User can open message dialog from action menu', async ({
  registrationActivityLogPage,
}) => {
  const actionName = 'Message';

  await test.step('Navigate to registration', async () => {
    await registrationActivityLogPage.goto(
      `/program/${programId}/registrations/${registrationId}`,
    );
  });

  await test.step(`Initiate action: ${actionName}`, async () => {
    await registrationActivityLogPage.initiateAction(actionName);
    await registrationActivityLogPage.validateDialogContent({
      title: 'Send message',
      content: `You're about to send a message to 1 registration(s).`,
    });
  });
});
