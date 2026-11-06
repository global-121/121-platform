import { expect } from '@playwright/test';

import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  postProgramRegistrationAttribute,
  updateProgramAccessGroupLevels,
} from '@121-service/test/helpers/program.helper';
import {
  searchRegistrationByReferenceId,
  seedIncludedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import { registrationPvScoped } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const programId = 2;
const registration = {
  ...registrationPvScoped,
  province: 'utrecht',
  district: 'houten',
};

test('User should see the access group of a registration', async ({
  registrationActivityLogPage,
  resetDBAndSeedRegistrations,
}) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
  });

  const accessToken = await getAccessToken();
  await postProgramRegistrationAttribute(
    {
      name: 'province',
      type: RegistrationAttributeTypes.dropdown,
      label: { en: 'Province' },
      options: [{ option: 'utrecht', label: { en: 'Utrecht' } }],
    },
    programId,
    accessToken,
  );
  await postProgramRegistrationAttribute(
    {
      name: 'district',
      type: RegistrationAttributeTypes.dropdown,
      label: { en: 'District' },
      options: [{ option: 'houten', label: { en: 'Houten' } }],
    },
    programId,
    accessToken,
  );
  await updateProgramAccessGroupLevels(
    programId,
    { accessGroupRegistrationAttributeNames: ['province', 'district'] },
    accessToken,
  );
  await seedIncludedRegistrations([registration], programId, accessToken);

  const searchRegistrationResponse = await searchRegistrationByReferenceId(
    registration.referenceId,
    programId,
    accessToken,
  );
  const registrationId = searchRegistrationResponse.body.data[0].id;

  await registrationActivityLogPage.goto(
    `/program/${programId}/registrations/${registrationId}`,
  );

  await test.step('Validate access group shows option labels per level', async () => {
    const summary =
      await registrationActivityLogPage.getRegistrationSummaryList();
    expect(summary['Access group']).toBe('Utrecht > Houten');
  });
});
