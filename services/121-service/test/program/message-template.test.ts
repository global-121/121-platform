/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';
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
  const messageId = 1;
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
  });

  it('should get all message template by programId', async () => {
    await postMessageTemplate(programId, messageTemplate, accessToken);

    // Act
    const getMessageTemplateResult = await getMessageTemplates(
      programId,
      accessToken,
    );

    // Assert
    expect(getMessageTemplateResult.statusCode).toBe(HttpStatus.OK);
    expect(getMessageTemplateResult.body.length).toBeGreaterThan(1);
  });

  it('should update message template by id', async () => {
    const typeMessageTemplate = 'test1';
    const updatedMessageTemplate = await updateMessageTemplate(
      programId,
      messageId,
      { type: typeMessageTemplate },
      accessToken,
    );

    // Assert
    expect(updatedMessageTemplate.statusCode).toBe(HttpStatus.OK);
    expect(updatedMessageTemplate.body.type).toBe(typeMessageTemplate);
  });
});
