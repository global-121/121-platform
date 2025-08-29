import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  deleteProject,
  getProject,
  startCbeValidationProcess,
} from '@121-service/test/helpers/project.helper';
import {
  getAttachments,
  uploadAttachment,
} from '@121-service/test/helpers/project-attachments.helper';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdOCW,
  projectIdPV,
  registrationCbe,
  registrationsOCW,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Delete project', () => {
  let accessToken: string;

  it('should delete nlrc projects', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    // Create some test data which should be cascaded deleted
    await seedPaidRegistrations(registrationsOCW, projectIdOCW);
    await seedPaidRegistrations(registrationsPV, projectIdPV);

    // Act + Assert
    const secretDto = { secret: env.RESET_SECRET };

    const deleteResponseOCW = await deleteProject(
      projectIdOCW,
      accessToken,
      secretDto,
    );
    expect(deleteResponseOCW.statusCode).toBe(HttpStatus.NO_CONTENT);

    const deleteResponsePV = await deleteProject(
      projectIdPV,
      accessToken,
      secretDto,
    );
    expect(deleteResponsePV.statusCode).toBe(HttpStatus.NO_CONTENT);

    const getProjectResponseOCW = await getProject(projectIdOCW, accessToken);
    expect(getProjectResponseOCW.statusCode).toBe(HttpStatus.NOT_FOUND);

    const getProjectResponsePV = await getProject(projectIdPV, accessToken);
    expect(getProjectResponsePV.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  it('should delete CBE projects', async () => {
    const projectIdCbe = 1;
    await resetDB(SeedScript.cbeProject, __filename);
    accessToken = await getAccessToken();

    await seedPaidRegistrations([registrationCbe], projectIdCbe);
    await startCbeValidationProcess(projectIdCbe, accessToken);

    // Act + Assert
    const secretDto = { secret: env.RESET_SECRET };
    const deleteResponseCbe = await deleteProject(
      projectIdCbe,
      accessToken,
      secretDto,
    );
    expect(deleteResponseCbe.statusCode).toBe(HttpStatus.NO_CONTENT);

    const getProjectResponseCbe = await getProject(projectIdCbe, accessToken);
    expect(getProjectResponseCbe.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  it('should delete a project with attachments', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    const testImagePath = './test-attachment-data/sample.jpg';
    const testImageFilename = 'Test Image';

    const response = await uploadAttachment({
      projectId: projectIdPV,
      filePath: testImagePath,
      filename: testImageFilename,
      accessToken,
    });

    expect(response.status).toBe(HttpStatus.CREATED);

    // Act + Assert
    const secretDto = { secret: env.RESET_SECRET };

    const deleteResponsePV = await deleteProject(
      projectIdPV,
      accessToken,
      secretDto,
    );
    expect(deleteResponsePV.statusCode).toBe(HttpStatus.NO_CONTENT);

    const getProjectResponsePV = await getProject(projectIdPV, accessToken);
    expect(getProjectResponsePV.statusCode).toBe(HttpStatus.NOT_FOUND);

    const attachment = await getAttachments({
      projectId: projectIdPV,
      accessToken,
    });

    // Assert
    expect(attachment.status).toBe(HttpStatus.FORBIDDEN);
  });
});
