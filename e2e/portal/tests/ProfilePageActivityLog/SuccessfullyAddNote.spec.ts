import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationPV5],
    programId: programIdPV,
  });
});

test('Successfully Add Note', async ({
  registrationsPage,
  tableComponent,
  registrationActivityLogPage,
}) => {
  const programTitle = NLRCProgramPV.titlePortal.en;

  await test.step('Select program', async () => {
    await registrationsPage.selectProgram(programTitle);
  });

  await test.step('Go to registration', async () => {
    await registrationsPage.goToRegistrationByName({
      registrationName: registrationPV5.fullName,
    });
  });

  await test.step('Add note', async () => {
    await registrationActivityLogPage.initiateAction('Add note');
    await registrationActivityLogPage.fillNote('This is a test note');
    await tableComponent.validateActivityPresentByType({
      notificationType: 'Note',
      count: 1,
    });
  });
});
