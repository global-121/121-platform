import { expect } from '@playwright/test';

import { CreateProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { postProgramRegistrationAttribute } from '@121-service/test/helpers/program.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const accessGroupLevelsFromBroadestToNarrowest = [
  { name: 'county', label: 'County', option: 'kisumu' },
  { name: 'subCounty', label: 'Sub-county', option: 'kisumuCentral' },
  { name: 'ward', label: 'Ward', option: 'kondele' },
];

const accessGroupAttributes: CreateProgramRegistrationAttributeDto[] =
  accessGroupLevelsFromBroadestToNarrowest.map(({ name, label, option }) => ({
    name,
    type: RegistrationAttributeTypes.dropdown,
    label: { en: label },
    options: [{ option, label: { en: option } }],
  }));

const accessGroupLevelLabels = accessGroupLevelsFromBroadestToNarrowest.map(
  ({ label }) => label,
);

test('Configure access group levels and remove a middle level', async ({
  page,
  programSettingsRegistrationDataPage,
  resetDBAndSeedRegistrations,
}) => {
  await test.step('Seed a program with location registration fields', async () => {
    // Arrange
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      skipSeedRegistrations: true,
    });
    const accessToken = await getAccessToken();
    for (const attribute of accessGroupAttributes) {
      await postProgramRegistrationAttribute(
        attribute,
        programIdPV,
        accessToken,
      );
    }
  });

  await test.step('Go to the registration data settings page', async () => {
    // Arrange
    await programSettingsRegistrationDataPage.goto(
      `/program/${programIdPV}/settings/registration-data`,
    );
  });

  await test.step('Show the empty state when no access group levels are configured', async () => {
    // Assert
    await expect(
      programSettingsRegistrationDataPage.accessGroupsCard,
    ).toContainText('Level 1: Select field by clicking on "Edit"');
  });

  await test.step('Select a registration field for each access group level', async () => {
    // Arrange
    await programSettingsRegistrationDataPage.accessGroupsCardEditButton.click();
    for (
      let levelCount = 1;
      levelCount < accessGroupLevelLabels.length;
      levelCount++
    ) {
      await programSettingsRegistrationDataPage.addAccessGroupLevelButton.click();
    }

    // Act
    for (const [levelIndex, label] of accessGroupLevelLabels.entries()) {
      await programSettingsRegistrationDataPage.selectAccessGroupLevel({
        levelNumber: levelIndex + 1,
        label,
      });
    }

    await programSettingsRegistrationDataPage.accessGroupsCardSaveButton.click();

    // Assert
    await programSettingsRegistrationDataPage.validateToastMessageAndClose(
      'Access groups saved successfully.',
    );
  });

  await test.step('Keep the access group levels in order after reloading the page', async () => {
    // Act
    await page.reload();

    // Assert
    await expect(
      programSettingsRegistrationDataPage.configuredAccessGroupLevels,
    ).toHaveText(
      accessGroupLevelLabels.map(
        (label, levelIndex) =>
          new RegExp(`Level ${levelIndex + 1}:\\s*${label}`),
      ),
    );
  });

  await test.step('Remove the middle access group level', async () => {
    // Arrange
    await programSettingsRegistrationDataPage.accessGroupsCardEditButton.click();

    // Act
    await programSettingsRegistrationDataPage.removeAccessGroupLevel({
      levelNumber: 2,
    });
    await programSettingsRegistrationDataPage.accessGroupsCardSaveButton.click();

    // Assert
    await programSettingsRegistrationDataPage.validateToastMessageAndClose(
      'Access groups saved successfully.',
    );
  });

  await test.step('Move the remaining access group levels up after reloading the page', async () => {
    // Act
    await page.reload();

    // Assert
    await expect(
      programSettingsRegistrationDataPage.configuredAccessGroupLevels,
    ).toHaveText([/Level 1:\s*County/, /Level 2:\s*Ward/]);
  });
});
