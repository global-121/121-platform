/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import programEth from '@121-service/src/seed-data/program/program-joint-response-dorcas.json';
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

// ##TODO: Enable these tests after FSP config endpoints are implemented (and the logic is reused in create program)
describe('Create program', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
  });

  it.skip('should post a program', async () => {
    // Arrange
    const programOcwJson = JSON.parse(JSON.stringify(programOCW));
    const programEthJson = JSON.parse(JSON.stringify(programEth));
    const programs = [programOcwJson, programEthJson];

    for (const program of programs) {
      // Act
      const createProgramResponse = await postProgram(program, accessToken);

      // Assert
      const programId = createProgramResponse.body.id;
      const getProgramResponse = await getProgram(programId, accessToken);
      expect(createProgramResponse.statusCode).toBe(HttpStatus.CREATED);

      const cleanedProgram = cleanProgramForAssertions(program);
      const cleanedProgramResponse = cleanProgramForAssertions(
        getProgramResponse.body,
      );

      expect(cleanedProgramResponse).toMatchSnapshot(
        `Create program response for program: ${program.titlePortal.en}`,
      );

      expect(cleanedProgramResponse).toMatchObject(cleanedProgram);
    }
  });

  it.skip('should not be able to post a program with 2 of the same names', async () => {
    // Arrange
    const programEthJson = JSON.parse(JSON.stringify(programEth));
    programEthJson.programQuestions[0].name = 'age';
    // Act
    const createProgramResponse = await postProgram(
      programEthJson,
      accessToken,
    );
    const getProgramResponse = await getProgram(4, accessToken);

    // Assert
    // const programId = createProgramResponse.body.id;
    expect(createProgramResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);

    // A new program should not have been created
    expect(getProgramResponse.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  it.skip('should not be able to post a program with missing names of full name naming convention', async () => {
    // Arrange
    const programOcwJson = JSON.parse(JSON.stringify(programOCW));
    programOcwJson.fullnameNamingConvention.push('middle_name');
    // Act
    const createProgramResponse = await postProgram(
      programOcwJson,
      accessToken,
    );
    const getProgramResponse = await getProgram(4, accessToken);

    // Assert
    // const programId = createProgramResponse.body.id;
    expect(createProgramResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);

    // A new program should not have been created
    expect(getProgramResponse.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  it.skip('should not be able to post a program with double names', async () => {
    // Arrange
    const programEthJson = JSON.parse(JSON.stringify(programEth));
    // Act
    const attribute = {
      name: 'gender',
      type: 'text',
      label: {
        en: 'string',
        fr: 'string',
      },
      showInPeopleAffectedTable: true,
      duplicateCheck: true,
    };
    programEthJson.programCustomAttributes.push(attribute);
    const createProgramResponse = await postProgram(
      programEthJson,
      accessToken,
    );
    const getProgramResponse = await getProgram(4, accessToken);

    // Assert
    // const programId = createProgramResponse.body.id;
    expect(createProgramResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);

    // A new program should not have been created
    expect(getProgramResponse.statusCode).toBe(HttpStatus.NOT_FOUND);
  });
});
