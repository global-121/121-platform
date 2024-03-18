/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';
import programOCW from '../../seed-data/program/program-nlrc-ocw.json';
import { SeedScript } from '../../src/scripts/seed-script.enum';
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

  it('should create a program with FSP configuration', async () => {
    // Arrange
    const program = JSON.parse(JSON.stringify(programOCW));

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
        }
      }
    }
  });
});
