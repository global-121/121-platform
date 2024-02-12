/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';
import { ExportType } from '../../src/metrics/dto/export-details.dto';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.enum';
import { postProgramQuestion } from '../helpers/program.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import { programIdPV } from '../registrations/pagination/pagination-data';

describe('Create program', () => {
  let accessToken: string;

  const programQuestion = {
    name: 'string',
    options: {},
    scoring: {},
    persistence: true,
    pattern: 'string',
    phases: [
      ProgramPhase.registrationValidation,
      ProgramPhase.inclusion,
      ProgramPhase.payment,
    ],
    editableInPortal: true,
    export: [ExportType.allPeopleAffected, ExportType.included],
    shortLabel: {
      en: 'Last Name',
    },
    placeholder: {
      en: '+31 6 00 00 00 00',
    },
    duplicateCheck: false,
    label: {
      en: 'Please enter your last name:',
      fr: "Remplissez votre nom, s'il vous plaît:",
    },
    answerType: 'text',
    questionType: 'standard',
  };

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
  });

  it('should post a program questions', async () => {
    // Act
    const createReponse = await postProgramQuestion(
      programQuestion as any,
      programIdPV,
      accessToken,
    );

    // Assert
    expect(createReponse.statusCode).toBe(HttpStatus.CREATED);
  });

  it('should no be able to post a question with a name that already exists', async () => {
    // Arrange
    await postProgramQuestion(programQuestion as any, programIdPV, accessToken);
    // Act
    const createReponse2 = await postProgramQuestion(
      programQuestion as any,
      programIdPV,
      accessToken,
    );
    // Assert
    expect(createReponse2.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should no be able to post a question without obligatory attributes', async () => {
    // Arrange
    const requiredAttributes = ['name', 'questionType', 'label', 'answerType'];
    for (const attribute of requiredAttributes) {
      const programQuestionCopy = { ...programQuestion };
      delete programQuestionCopy[attribute];

      const createReponse = await postProgramQuestion(
        programQuestionCopy as any,
        programIdPV,
        accessToken,
      );
      // Assert
      expect(createReponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    }
  });

  it('should no be able to post a question with a fsp/custom attribute name that exists', async () => {
    // Arrange
    const names = ['namePartnerOrganization', 'whatsappPhoneNumber'];
    for (const name of names) {
      const programQuestionCopy = { ...programQuestion };
      programQuestionCopy.name = name;

      // Act
      const createReponse = await postProgramQuestion(
        programQuestionCopy as any,
        programIdPV,
        accessToken,
      );
      // Assert
      expect(createReponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    }
  });
});
