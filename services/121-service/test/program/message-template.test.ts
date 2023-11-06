/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import {
  getMessageTemplate,
  postMessageTemplate,
  updateMessageTemplate,
} from '../helpers/program.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';

describe('Message template', () => {
  let accessToken: string;
  const programId = 1;
  const messageTemplate = {
    type: 'test',
    language: 'en',
    message: 'testing message',
    isWhatsappTemplate: true,
  };

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
  });

  it('should create message template', async () => {
    // Act
    const postMessageTemplateResult = await postMessageTemplate(
      programId,
      messageTemplate,
      accessToken,
    );

    // Assert
    expect(postMessageTemplateResult.statusCode).toBe(HttpStatus.CREATED);
    expect(postMessageTemplateResult.body.type).toBe(messageTemplate.type);
    expect(postMessageTemplateResult.body.language).toBe(
      messageTemplate.language,
    );
    expect(postMessageTemplateResult.body.message).toBe(
      messageTemplate.message,
    );
    expect(postMessageTemplateResult.body.isWhatsappTemplate).toBe(
      messageTemplate.isWhatsappTemplate,
    );
  });

  it('should get all message template by programId', async () => {
    await postMessageTemplate(programId, messageTemplate, accessToken);

    // Act
    const getMessageTemplateResult = await getMessageTemplate(
      programId,
      accessToken,
    );

    // Assert
    expect(getMessageTemplateResult.statusCode).toBe(HttpStatus.OK);
    expect(getMessageTemplateResult.body.length).toBe(1);
    expect(getMessageTemplateResult.body[0].type).toBe(messageTemplate.type);
    expect(getMessageTemplateResult.body[0].language).toBe(
      messageTemplate.language,
    );
    expect(getMessageTemplateResult.body[0].message).toBe(
      messageTemplate.message,
    );
    expect(getMessageTemplateResult.body[0].isWhatsappTemplate).toBe(
      messageTemplate.isWhatsappTemplate,
    );
  });

  it('should update message template by id', async () => {
    const postMessageTemplateResponse = await postMessageTemplate(
      programId,
      messageTemplate,
      accessToken,
    );

    const typeMessageTemplate = 'test1';
    await updateMessageTemplate(
      programId,
      postMessageTemplateResponse.body.id,
      { type: typeMessageTemplate },
      accessToken,
    );

    // Act
    const getMessageTemplateResult = await getMessageTemplate(
      programId,
      accessToken,
    );

    // Assert
    expect(getMessageTemplateResult.statusCode).toBe(HttpStatus.OK);
    expect(getMessageTemplateResult.body.length).toBe(1);
    expect(getMessageTemplateResult.body[0].type).toBe(typeMessageTemplate);
  });
});
