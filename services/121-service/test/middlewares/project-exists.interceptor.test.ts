import { HttpStatus } from '@nestjs/common';

import { CreateProjectFspConfigurationDto } from '@121-service/src/project-fsp-configurations/dtos/create-project-fsp-configuration.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { postProjectFspConfiguration } from '@121-service/test/helpers/project-fsp-configuration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Project exist interceptor', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should throw an error if the project does not exist', async () => {
    // Act
    const nonExistingProjectId = 999999;
    const result = await postProjectFspConfiguration({
      projectId: nonExistingProjectId,
      body: new CreateProjectFspConfigurationDto(),
      accessToken,
    });

    // Assert
    expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(result.body?.message).toContain('Project');
    expect(result.body?.message).toContain(String(nonExistingProjectId));
  });
});
