/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';

import { ExportType } from '@121-service/src/metrics/dto/export-details.dto';
import { CreateProgramQuestionDto } from '@121-service/src/programs/dto/program-question.dto';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { postProgramQuestion } from '@121-service/test/helpers/program.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

describe('Create program', () => {
  let accessToken: string;

  const programQuestion = {
    name: 'string',
    options: {},
    scoring: {},
    persistence: true,
    pattern: 'string',
    showInPeopleAffectedTable: true,
    editableInPortal: true,
    export: [ExportType.allPeopleAffected, ExportType.included],
    label: {
      en: 'Last Name',
    },
    placeholder: {
      en: '+31 6 00 00 00 00',
    },
    duplicateCheck: false,
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
      programQuestion as CreateProgramQuestionDto,
      programIdPV,
      accessToken,
    );

    // Assert
    expect(createReponse.statusCode).toBe(HttpStatus.CREATED);
  });

  it('should no be able to post a question with a name that already exists', async () => {
    // Arrange
    await postProgramQuestion(
      programQuestion as CreateProgramQuestionDto,
      programIdPV,
      accessToken,
    );
    // Act
    const createReponse2 = await postProgramQuestion(
      programQuestion as CreateProgramQuestionDto,
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
      const programQuestionCopy: Partial<typeof programQuestion> = {
        ...programQuestion,
      };
      delete programQuestionCopy[attribute as keyof typeof programQuestion];

      const createResponse = await postProgramQuestion(
        programQuestionCopy as CreateProgramQuestionDto,
        programIdPV,
        accessToken,
      );
      // Assert
      expect(createResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
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
        programQuestionCopy as CreateProgramQuestionDto,
        programIdPV,
        accessToken,
      );
      // Assert
      expect(createReponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    }
  });
});
