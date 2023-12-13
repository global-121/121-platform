/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';
import { CreateMessageTemplateDto } from '../../src/notifications/message-template/dto/message-template.dto';
import { LanguageEnum } from '../../src/registration/enum/language.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import {
  getMessageTemplates,
  postMessageTemplate,
  updateMessageTemplate,
} from '../helpers/program.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';

describe('Message template', () => {
  let accessToken: string;
  const programId = 1;
  const type = 'registered';
  const language = LanguageEnum.en;
  const messageTemplate = {
    message: 'testing message',
    isWhatsappTemplate: true,
  };

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
  });

  it('should create message template', async () => {
    // Arrange
    messageTemplate['type'] = type;
    messageTemplate['language'] = language;

    // Act
    const postMessageTemplateResult = await postMessageTemplate(
      programId,
      messageTemplate as CreateMessageTemplateDto,
      accessToken,
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
    const updatedMessage = 'test1';
    const updatedMessageTemplate = await updateMessageTemplate(
      programId,
      type,
      language,
      { message: updatedMessage },
      accessToken,
    );

    // Assert
    expect(updatedMessageTemplate.statusCode).toBe(HttpStatus.OK);
    expect(updatedMessageTemplate.body.message).toBe(updatedMessage);
  });
});
