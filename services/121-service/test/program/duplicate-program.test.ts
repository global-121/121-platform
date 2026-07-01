import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  duplicateProgram,
  getProgram,
} from '@121-service/test/helpers/program.helper';
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

  it('should copy a program and persist it', async () => {
    // Arrange
    const sourceProgramResponse = await getProgram(
      copyFromProgramId,
      accessToken,
    );
    const sourceProgram = sourceProgramResponse.body;

    // Act
    const duplicateResponse = await duplicateProgram(
      copyFromProgramId,
      accessToken,
    );

    // Assert
    expect(duplicateResponse.statusCode).toBe(HttpStatus.CREATED);

    const newProgramId = duplicateResponse.body.id;
    expect(newProgramId).toBeDefined();
    expect(newProgramId).not.toBe(copyFromProgramId);

    // The copy should be retrievable, proving it was persisted.
    const persistedProgramResponse = await getProgram(
      newProgramId,
      accessToken,
    );
    expect(persistedProgramResponse.statusCode).toBe(HttpStatus.OK);
    expect(persistedProgramResponse.body.id).toBe(newProgramId);
    expect(persistedProgramResponse.body.titlePortal).toStrictEqual(
      sourceProgram.titlePortal,
    );
    expect(persistedProgramResponse.body.currency).toBe(sourceProgram.currency);
  });
});
