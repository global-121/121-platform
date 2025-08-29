/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import projectCbe from '@121-service/src/seed-data/project/project-cbe.json';
import projectOCW from '@121-service/src/seed-data/project/project-nlrc-ocw.json';
import {
  getProject,
  postProject,
} from '@121-service/test/helpers/project.helper';
import {
  cleanProjectForAssertions,
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Create project', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should post a project', async () => {
    // Arrange
    const projectOcwJson = JSON.parse(JSON.stringify(projectOCW));
    const projectCbeJson = JSON.parse(JSON.stringify(projectCbe));
    const seedProjects = [projectOcwJson, projectCbeJson];

    for (const seedProject of seedProjects) {
      // Act
      const createProjectResponse = await postProject(seedProject, accessToken);

      // Assert
      const projectId = createProjectResponse.body.id;
      const getProjectResponse = await getProject(projectId, accessToken);
      expect(createProjectResponse.statusCode).toBe(HttpStatus.CREATED);

      const cleanedSeedProject = cleanProjectForAssertions(seedProject);
      const cleanedProjectResponse = cleanProjectForAssertions(
        getProjectResponse.body,
      );

      expect(cleanedProjectResponse).toMatchSnapshot(
        `Create project response for project: ${seedProject.titlePortal.en}`,
      );

      expect(cleanedProjectResponse).toMatchObject(cleanedSeedProject);
    }
  });

  it('should not be able to post a project with 2 of the same names', async () => {
    // Arrange
    const projectCbeJson = JSON.parse(JSON.stringify(projectCbe));
    projectCbeJson.projectRegistrationAttributes.push(
      projectCbeJson.projectRegistrationAttributes[0],
    );
    // Act
    const createProjectResponse = await postProject(
      projectCbeJson,
      accessToken,
    );
    const getProjectResponse = await getProject(4, accessToken);

    // Assert
    expect(createProjectResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(createProjectResponse.body).toMatchSnapshot();

    // A new project should not have been created
    expect(getProjectResponse.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  it('should not be able to post a project with missing names of full name naming convention', async () => {
    // Arrange
    const projectOcwJson = JSON.parse(JSON.stringify(projectOCW));
    projectOcwJson.fullnameNamingConvention.push('middle_name');
    // Act
    const createProjectResponse = await postProject(
      projectOcwJson,
      accessToken,
    );
    const getProjectResponse = await getProject(4, accessToken);

    // Assert
    // const projectId = createProjectResponse.body.id;
    expect(createProjectResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(createProjectResponse.body).toMatchSnapshot();

    // A new project should not have been created
    expect(getProjectResponse.statusCode).toBe(HttpStatus.NOT_FOUND);
  });
});
