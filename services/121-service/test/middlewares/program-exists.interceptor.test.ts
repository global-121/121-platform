import { HttpStatus } from '@nestjs/common';

import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { postProgramFspConfiguration } from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Program exist interceptor', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should throw an error if the program does not exist', async () => {
    // Act
    const nonExistingProgramId = 999999;
    const result = await postProgramFspConfiguration({
      programId: nonExistingProgramId,
      body: new CreateProgramFspConfigurationDto(),
      accessToken,
    });

    // Assert
    expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(result.body?.message).toContain('Program');
    expect(result.body?.message).toContain(String(nonExistingProgramId));
  });
});
