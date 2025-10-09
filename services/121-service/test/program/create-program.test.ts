/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import programCbe from '@121-service/src/seed-data/program/program-cbe.json';
import programOCW from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import {
  getProgram,
  postProgram,
} from '@121-service/test/helpers/program.helper';
import {
  cleanProgramForAssertions,
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Create program', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should post a program', async () => {
    // Arrange
    const programOcwJson = JSON.parse(JSON.stringify(programOCW));
    const programCbeJson = JSON.parse(JSON.stringify(programCbe));
    const seedPrograms = [programOcwJson, programCbeJson];

    for (const seedProgram of seedPrograms) {
      // Act
      const createProgramResponse = await postProgram(seedProgram, accessToken);

      // Assert
      const programId = createProgramResponse.body.id;
      const getProgramResponse = await getProgram(programId, accessToken);
      expect(createProgramResponse.statusCode).toBe(HttpStatus.CREATED);

      const cleanedSeedProgram = cleanProgramForAssertions(seedProgram);
      const cleanedProgramResponse = cleanProgramForAssertions(
        getProgramResponse.body,
      );

      expect(cleanedProgramResponse).toMatchSnapshot(
        `Create program response for program: ${seedProgram.titlePortal.en}`,
      );

      expect(cleanedProgramResponse).toMatchObject(cleanedSeedProgram);
    }
  });

  it('should post a program with the minimum amount of attributes', async () => {
    // Arrange
    const minimalProgram = {
      titlePortal: {
        en: 'Test Title',
      },
      currency: 'EUR',
    };

    const minimalProgramJson = JSON.parse(JSON.stringify(minimalProgram));

    // Act
    const createProgramResponse = await postProgram(
      minimalProgramJson,
      accessToken,
    );

    // Assert
    expect(createProgramResponse.statusCode).toBe(HttpStatus.CREATED);
    const expectedTitlePortal = 'Test Title';
    const expectedCurreny = 'EUR';
    expect(createProgramResponse.body).toEqual(
      expect.objectContaining({
        titlePortal: expect.objectContaining({
          en: expectedTitlePortal,
        }),
        currency: expectedCurreny,
      }),
    );
  });

  it('should not be able to post a program with 2 of the same names', async () => {
    //   // Arrange
    const programCbeJson = JSON.parse(JSON.stringify(programCbe));
    programCbeJson.programRegistrationAttributes.push(
      programCbeJson.programRegistrationAttributes[0],
    );
    // Act
    const createProgramResponse = await postProgram(
      programCbeJson,
      accessToken,
    );
    const getProgramResponse = await getProgram(4, accessToken);

    // Assert
    expect(createProgramResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(createProgramResponse.body).toMatchSnapshot();

    // A new program should not have been created
    expect(getProgramResponse.statusCode).toBe(HttpStatus.NOT_FOUND);
  });
});
