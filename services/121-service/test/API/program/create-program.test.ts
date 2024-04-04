/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';
import programEth from '../../seed-data/program/program-joint-response-dorcas.json';
import programOCW from '../../seed-data/program/program-nlrc-ocw.json';
import { SeedScript } from '../../../src/scripts/seed-script.enum';
import {
  assertArraysAreEqual,
  assertObjectsAreEqual,
} from '../helpers/assert.helper';
import { getProgram, postProgram } from '../helpers/program.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';

describe('Create program questions', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
  });

  it('should post a program', async () => {
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

      const keyToIgnore = ['configuration', 'startDate', 'endDate'];
      for (const key in program) {
        if (!keyToIgnore.includes(key)) {
          if (Array.isArray(getProgramResponse.body[key])) {
            // If both properties are arrays, compare length and values
            assertArraysAreEqual(
              getProgramResponse.body[key],
              program[key],
              keyToIgnore,
            );
          } else if (typeof getProgramResponse.body[key] === 'object') {
            // If both properties are objects, recursively validate
            assertObjectsAreEqual(
              getProgramResponse.body[key],
              program[key],
              keyToIgnore,
            );
          } else {
            expect(getProgramResponse.body[key]).toBe(program[key]);
            // Compare values
          }
        }
      }
    }
  });

  it('should not be able to post a program with 2 of the same names', async () => {
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

  it('should not be able to post a program with missing names of full name naming convention', async () => {
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

  it('should not be able to post a program with double names', async () => {
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
      phases: ['registrationValidation', 'inclusion', 'payment'],
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
