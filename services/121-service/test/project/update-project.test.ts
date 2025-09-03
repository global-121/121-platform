import { HttpStatus } from '@nestjs/common';

import { UpdateProjectDto } from '@121-service/src/projects/dto/update-project.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { patchProject } from '@121-service/test/helpers/project.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Update project', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should update a project', async () => {
    // Arrange
    // Test with a few possibly to be changed attributes, not all attributes of a project
    const project: UpdateProjectDto = {
      titlePortal: { en: 'new title' },
      published: false,
      distributionDuration: 100,
      fixedTransferValue: 500,
      budget: 50000,
      monitoringDashboardUrl: 'https://example.org/new-dashboard',
      aboutProject: { en: 'new description' },
      fullnameNamingConvention: ['firstName', 'lastName'],
      tryWhatsAppFirst: true,
      languages: [LanguageEnum.en, LanguageEnum.nl],
    };

    // Act
    // Call the update function
    const updateProjectResponse = await patchProject(2, project, accessToken);

    // Assert
    // Check the response to see if the attributes were actually updated
    expect(updateProjectResponse.statusCode).toBe(HttpStatus.OK);
    expect(updateProjectResponse.body.titlePortal).toMatchObject(
      project.titlePortal!,
    );
    expect(updateProjectResponse.body.published).toBe(project.published);
    expect(updateProjectResponse.body.distributionDuration).toBe(
      project.distributionDuration,
    );
    expect(updateProjectResponse.body.fixedTransferValue).toBe(
      project.fixedTransferValue,
    );
    expect(updateProjectResponse.body.budget).toBe(project.budget);
    expect(updateProjectResponse.body.monitoringDashboardUrl).toBe(
      project.monitoringDashboardUrl,
    );
    expect(updateProjectResponse.body.aboutProject).toMatchObject(
      project.aboutProject!,
    );
    expect(updateProjectResponse.body.fullnameNamingConvention).toStrictEqual(
      project.fullnameNamingConvention,
    );
    expect(updateProjectResponse.body.tryWhatsAppFirst).toBe(
      project.tryWhatsAppFirst,
    );
  });
});
