import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  duplicateProgram,
  getProgram,
} from '@121-service/test/helpers/program.helper';
import { postProgramFspConfiguration } from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Duplicate program', () => {
  const copyFromProgramId = 2;
  let accessToken: string;

  beforeEach(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessToken = await getAccessToken();
  });

  it('should duplicate a program and persist it', async () => {
    // Arrange
    const sourceProgramResponse = await getProgram(
      copyFromProgramId,
      accessToken,
    );
    const sourceProgram = sourceProgramResponse.body;

    // Act
    const duplicateResponse = await duplicateProgram(
      { copyFromProgramId, accessToken },
    );
    const newProgramId = duplicateResponse.body.id;
    const persistedProgramResponse = await getProgram(
      newProgramId,
      accessToken,
    );

    // Assert
    expect(duplicateResponse.statusCode).toBe(HttpStatus.CREATED);
    expect(newProgramId).toBeDefined();
    expect(newProgramId).not.toBe(copyFromProgramId);
    expect(persistedProgramResponse.body.titlePortal).toStrictEqual(
      sourceProgram.titlePortal,
    );
    expect(persistedProgramResponse.body.currency).toBe(sourceProgram.currency);
  });

  it('should duplicate fsp configurations relation', async () => {
    // Arrange
    const fspConfigurationName = `duplicate-test-${Date.now()}`;
    await postProgramFspConfiguration({
      programId: copyFromProgramId,
      body: {
        name: fspConfigurationName,
        label: { en: 'Duplicate test FSP' },
        fspName: Fsps.intersolveVisa,
      },
      accessToken,
    });
    
    const sourceProgramResponse = await getProgram(
      copyFromProgramId,
      accessToken,
    );
    const sourceProgram = sourceProgramResponse.body;
    const sourceFspConfigurations = sourceProgram.fspConfigurations ?? [];
    
    // Act
    const duplicateResponse = await duplicateProgram(
      { copyFromProgramId, accessToken },
    );
    const newProgramId = duplicateResponse.body.id;
    const persistedProgramResponse = await getProgram(
      newProgramId,
      accessToken,
    );
    const duplicatedFspConfigurations =
      persistedProgramResponse.body.fspConfigurations ?? [];
    
    // Assert
    expect(sourceFspConfigurations.length).toBeGreaterThan(0);
    expect(duplicatedFspConfigurations.length).toBe(
      sourceFspConfigurations.length,
    );
    expect(
      duplicatedFspConfigurations.some(
        (configuration) =>
          configuration.name === fspConfigurationName &&
          configuration.fspName === Fsps.intersolveVisa,
      ),
    ).toBe(true);
  });
});
