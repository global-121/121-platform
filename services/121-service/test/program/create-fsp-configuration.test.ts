/* eslint-disable jest/no-conditional-expect */
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import programOCW from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import {
  assertArraysAreEqual,
  assertObjectsAreEqual,
} from '@121-service/test/helpers/assert.helper';
import {
  getProgram,
  postProgram,
} from '@121-service/test/helpers/program.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { HttpStatus } from '@nestjs/common';

describe('Create program questions', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
  });

  it('should create a program with FSP configuration', async () => {
    // Arrange
    const program = JSON.parse(JSON.stringify(programOCW));

    // Add test display name to program
    const intersolveVoucherWhatsappTranslations = {
      name: 'displayName',
      value: {
        en: 'Intersolve Voucher WhatsApp',
        nl: 'Intersolve Voucher WhatsApp Dutch translation',
        es: 'Intersolve Voucher WhatsApp Spanish translation',
      },
    };

    program.financialServiceProviders[0].configuration.push(
      intersolveVoucherWhatsappTranslations,
    );

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
