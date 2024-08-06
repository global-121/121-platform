/* eslint-disable jest/no-conditional-expect */
import { CreateMessageTemplateDto } from '@121-service/src/notifications/message-template/dto/message-template.dto';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import {
  getMessageTemplates,
  postMessageTemplate,
  updateMessageTemplate,
} from '@121-service/test/helpers/program.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';
import { HttpStatus } from '@nestjs/common';

describe('Message template', () => {
  let accessToken: string;
  const programId = programIdPV;
  const type = 'type';
  const language = LanguageEnum.en;
  const messageTemplate = {
    message: 'testing message',
    isWhatsappTemplate: true,
    isSendMessageTemplate: true,
    label: { en: 'test' },
  };

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
  });

  it('should create message template', async () => {
    // Arrange
    messageTemplate['type'] = type;
    messageTemplate['language'] = language;
    messageTemplate['message'] = 'testing message';

    // Act
    const postMessageTemplateResult = await postMessageTemplate(
      programId,
      messageTemplate as CreateMessageTemplateDto,
      accessToken,
    );
    console.log(
      'postMessageTemplateResult: ',
      postMessageTemplateResult.statusCode,
    );

    // Assert
    expect(postMessageTemplateResult.statusCode).toBe(HttpStatus.CREATED);
  });

  it('should NOT create message template when invalid placeholder is included', async () => {
    // Arrange
    messageTemplate['type'] = type;
    messageTemplate['language'] = language;
    messageTemplate['message'] = 'testing message {{invalid}}';

    // Act
    const postMessageTemplateResult = await postMessageTemplate(
      programId,
      messageTemplate as CreateMessageTemplateDto,
      accessToken,
    );

    // Assert
    expect(postMessageTemplateResult.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should get all message template by programId', async () => {
    await postMessageTemplate(
      programId,
      messageTemplate as CreateMessageTemplateDto,
      accessToken,
    );

    // Act
    const getMessageTemplateResult = await getMessageTemplates(
      programId,
      accessToken,
    );

    // Assert
    expect(getMessageTemplateResult.statusCode).toBe(HttpStatus.OK);
    expect(getMessageTemplateResult.body.length).toBeGreaterThan(1);
  });

  it('should update message template by language and type', async () => {
    const typeToUpdate = 'registered';
    const updatedMessage = 'test1';
    const updatedMessageTemplate = await updateMessageTemplate(
      programId,
      typeToUpdate,
      language,
      { message: updatedMessage },
      accessToken,
    );

    // Assert
    expect(updatedMessageTemplate.statusCode).toBe(HttpStatus.OK);
    expect(updatedMessageTemplate.body.message).toBe(updatedMessage);
  });
});
