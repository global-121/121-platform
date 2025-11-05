import { HttpStatus } from '@nestjs/common';

import { ContentSidMessageTypes } from '@121-service/src/notifications/message-template/const/content-sid-message-types.const';
import { CreateMessageTemplateDto } from '@121-service/src/notifications/message-template/dto/message-template.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';
import {
  deleteMessageTemplate,
  getMessageTemplates,
  postMessageTemplate,
  updateMessageTemplate,
} from '@121-service/test/helpers/program.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Message template', () => {
  let accessToken: string;
  const programId = 1;
  const regularType = 'regular-type';
  const contentSidType = ContentSidMessageTypes[0]; // Using first content SID type
  const language = UILanguage.en;
  const baseTemplateData = {
    isSendMessageTemplate: true,
    label: { en: 'test' },
    language,
  };

  beforeAll(async () => {
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();
  });

  beforeEach(async () => {
    // Clean up any existing templates before each test
    // Save a bit of processing time by not resetting the DB

    await deleteMessageTemplate({
      programId,
      type: regularType,
      accessToken,
    });
  });

  describe('Regular message templates', () => {
    it('should create message template with a message for regular type', async () => {
      // Arrange
      const templateData = {
        ...baseTemplateData,
        type: regularType,
        message: 'testing message',
      };

      // Act
      const result = await postMessageTemplate(
        programId,
        templateData as CreateMessageTemplateDto,
        accessToken,
      );
      const currentTemplates = await getMessageTemplates(
        programId,
        accessToken,
      );
      // Check if the template was created
      const createdTemplate = currentTemplates.body.find(
        (template) =>
          template.type === regularType && template.language === language,
      );

      // Assert
      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(createdTemplate).toMatchObject({
        message: templateData.message,
        type: templateData.type,
        language: templateData.language,
        contentSid: null,
      });
    });

    it('should NOT create regular message template with contentSid', async () => {
      // Arrange
      const templateData = {
        ...baseTemplateData,
        type: regularType,
        contentSid: 'HCf',
      };

      // Act
      const result = await postMessageTemplate(
        programId,
        templateData as CreateMessageTemplateDto,
        accessToken,
      );

      // Assert
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.body.errors).toContain('Content SID is not allowed');
    });

    it('should NOT create regular message template without message', async () => {
      // Arrange
      const templateData = {
        ...baseTemplateData,
        type: regularType,
      };

      // Act
      const result = await postMessageTemplate(
        programId,
        templateData as CreateMessageTemplateDto,
        accessToken,
      );

      // Assert
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.body.errors).toContain('Message is required');
    });
  });

  describe('ContentSid message templates', () => {
    it('should create message template with contentSid for ContentSid type', async () => {
      // Arrange
      const templateData = {
        ...baseTemplateData,
        type: contentSidType,
        contentSid: 'HCf',
      };

      // First delete any existing template with the same type and language
      await deleteMessageTemplate({
        programId,
        type: contentSidType,
        accessToken,
      });

      // Act
      const result = await postMessageTemplate(
        programId,
        templateData as CreateMessageTemplateDto,
        accessToken,
      );
      const currentTemplates = await getMessageTemplates(
        programId,
        accessToken,
      );
      // Check if the template was created
      const createdTemplate = currentTemplates.body.find(
        (template) =>
          template.type === contentSidType && template.language === language,
      );

      // Assert
      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(createdTemplate).toMatchObject({
        contentSid: templateData.contentSid,
        type: templateData.type,
        language: templateData.language,
        message: null,
      });
    });

    it('should NOT create ContentSid template without contentSid', async () => {
      // Arrange
      const templateData = {
        ...baseTemplateData,
        type: contentSidType,
        message: 'This message should not matter',
      };

      // Act
      const result = await postMessageTemplate(
        programId,
        templateData as CreateMessageTemplateDto,
        accessToken,
      );

      // Assert
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.body.errors).toContain('Content SID is required');
    });
  });

  describe('General validation', () => {
    it('should NOT create message template when invalid placeholder is included', async () => {
      // Arrange
      const templateData = {
        ...baseTemplateData,
        type: regularType,
        message: 'testing message {{invalid}}',
      };

      // Act
      const result = await postMessageTemplate(
        programId,
        templateData as CreateMessageTemplateDto,
        accessToken,
      );

      // Assert
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.body.errors).toContain('Placeholder {{invalid}} not found');
    });

    it('should get all message templates by programId', async () => {
      // Arrange
      await postMessageTemplate(
        programId,
        {
          ...baseTemplateData,
          type: regularType,
          message: 'test message',
        } as CreateMessageTemplateDto,
        accessToken,
      );

      // Act
      const result = await getMessageTemplates(programId, accessToken);

      // Assert
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.body.length).toBeGreaterThan(0);
    });
  });

  describe('Template updates', () => {
    it('should update message for regular template', async () => {
      // Arrange
      const typeToUpdate = 'whatsappVoucher'; //assuming 'whatsappVoucher' is part of message-template-generic.const.ts
      const updatedMessage = 'updated test message';

      // Act
      const result = await updateMessageTemplate({
        programId,
        type: typeToUpdate,
        language,
        body: { message: updatedMessage },
        accessToken,
      });

      // Assert
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.body.message).toBe(updatedMessage);
    });

    it('should update contentSid for ContentSid template', async () => {
      // First create a ContentSid template
      await postMessageTemplate(
        programId,
        {
          ...baseTemplateData,
          type: contentSidType,
          contentSid: 'HCf123',
        } as CreateMessageTemplateDto,
        accessToken,
      );

      // Act - update it
      const updatedContentSid = 'HCf456';
      const result = await updateMessageTemplate({
        programId,
        type: contentSidType,
        language,
        body: { contentSid: updatedContentSid },
        accessToken,
      });

      // Assert
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.body.contentSid).toBe(updatedContentSid);
    });

    it(`should NOT allow adding contentSid to a template of type: ${ContentSidMessageTypes.join(', ')}`, async () => {
      // Arrange
      const typeToUpdate = 'whatsappVoucher'; //assuming 'whatsappVoucher' is part of message-template-generic.const.ts

      // Act
      const result = await updateMessageTemplate({
        programId,
        type: typeToUpdate,
        language,
        body: { contentSid: 'HCf789' },
        accessToken,
      });

      // Assert
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.body.errors).toContain('Content SID is not allowed');
    });
  });
});
