/* eslint-disable jest/no-conditional-expect */
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
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

    const cleanedProgram = cleanProgramForAssertions(program);
    const cleanedProgramResponse = cleanProgramForAssertions(
      getProgramResponse.body,
    );

    expect(cleanedProgramResponse).toMatchSnapshot(
      `Create program response for program: ${program.titlePortal.en}`,
    );

    expect(cleanedProgramResponse).toMatchObject(cleanedProgram);
  });
});
