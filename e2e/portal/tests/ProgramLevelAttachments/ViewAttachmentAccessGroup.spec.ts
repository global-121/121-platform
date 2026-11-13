import { expect } from '@playwright/test';
import path from 'node:path';

import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import {
  postProgramRegistrationAttribute,
  updateProgramAccessGroupLevels,
} from '@121-service/test/helpers/program.helper';
import { uploadAttachment } from '@121-service/test/helpers/program-attachments.helper';
import {
  createAccessTokenWithPermissions,
  getAccessToken,
} from '@121-service/test/helpers/utility.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const pdfFilePath = path.resolve(
  __dirname,
  '../../../test-file-upload-data/test-pdf-document.pdf',
);

test('User should see the access group of an attachment', async ({
  programMonitoringPage,
  resetDBAndSeedRegistrations,
  tableComponent,
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
    programIdOCW,
    accessToken,
  );
  await postProgramRegistrationAttribute(
    {
      name: 'district',
      type: RegistrationAttributeTypes.dropdown,
      label: { en: 'District' },
      options: [{ option: 'houten', label: { en: 'Houten' } }],
    },
    programIdOCW,
    accessToken,
  );
  await updateProgramAccessGroupLevels(
    programIdOCW,
    { accessGroupRegistrationAttributeNames: ['province', 'district'] },
    accessToken,
  );

  const uploaderAccessToken = await createAccessTokenWithPermissions({
    permissions: [PermissionEnum.ProgramAttachmentsCREATE],
    programId: programIdOCW,
    adminAccessToken: accessToken,
    accessGroups: [
      { programRegistrationAttributeName: 'province', value: 'utrecht' },
      { programRegistrationAttributeName: 'district', value: 'houten' },
    ],
  });
  await uploadAttachment({
    programId: programIdOCW,
    filePath: pdfFilePath,
    filename: 'Houten monitoring report',
    accessToken: uploaderAccessToken,
  });

  await programMonitoringPage.goto(`/program/${programIdOCW}/monitoring/files`);

  await test.step('Validate access group shows option labels per level', async () => {
    await tableComponent.validateWaitForTableRowCount({ expectedRowCount: 1 });

    const accessGroupColumnIndex =
      await tableComponent.getColumnIndexByHeaderText('Access group');
    const accessGroupCell = await tableComponent.getCell(
      0,
      accessGroupColumnIndex,
    );

    await expect(accessGroupCell).toHaveText('Utrecht / Houten');
  });
});
