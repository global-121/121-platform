import { Test } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { MessageTemplateController } from './message-template.controller';
import { MessageTemplateService } from './message-template.service';
import { MessageTemplateEntity } from './message-template.entity';
import { LanguageEnum } from '../../registration/enum/language.enum';

const moduleMocker = new ModuleMocker(global);

describe('MessageTemplatesService', () => {
  let controller: MessageTemplateController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MessageTemplateController],
    })
      .useMocker((token) => {
        const results = {
          id: 1,
          type: 'test1',
          language: 'en',
          message: 'testing message',
          isWhatsappTemplate: true,
        };
        if (token === MessageTemplateService) {
          return { findAll: jest.fn().mockResolvedValue(results) };
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    controller = moduleRef.get(MessageTemplateController);
  });

  describe('createMessageTemplate', () => {
    it('should create message template', async () => {
      // Mock the createMessageTemplate method to return the array of messageTemplates
      const createMessageTemplateMock = jest
        .spyOn(controller, 'createMessageTemplate')
        .mockResolvedValue();

      const programId = 1;
      const messageTemplate = {
        type: 'dsadsaasd12123dsa',
        language: LanguageEnum.en,
        message: 'test1',
        isWhatsappTemplate: true,
      };

      const response = await controller.createMessageTemplate(
        programId,
        messageTemplate,
      );

      // Ensure that the response matches the expected result
      expect(response).toEqual(undefined);

      // Ensure that the createMessageTemplate method was called with the correct arguments
      expect(createMessageTemplateMock).toHaveBeenCalledWith(
        programId,
        messageTemplate,
      );
    });

    it('should get all message template by programId', async () => {
      const result: MessageTemplateEntity[] = [
        {
          id: 1,
          created: new Date(),
          updated: new Date(),
          type: 'dsadsaasd12123dsa',
          language: LanguageEnum.en,
          message: 'test1',
          isWhatsappTemplate: true,
          programId: 1,
        },
      ];

      // Mock the createMessageTemplate method to return the array of messageTemplates
      const createMessageTemplateMock = jest
        .spyOn(controller, 'getMessageTemplatesByProgramId')
        .mockResolvedValue(result);

      const params = {
        programId: 1,
      };

      const response = await controller.getMessageTemplatesByProgramId(params);

      // Ensure that the response matches the expected result
      expect(response).toEqual(result);

      // Ensure that the createMessageTemplate method was called with the correct arguments
      expect(createMessageTemplateMock).toHaveBeenCalledWith(params);
    });

    it('should update message template by type and language', async () => {
      const result: MessageTemplateEntity = {
        id: 1,
        created: new Date(),
        updated: new Date(),
        type: 'test1',
        language: LanguageEnum.en,
        message: 'testing message',
        isWhatsappTemplate: false,
        programId: 1,
      };

      // Mock the createMessageTemplate method to return the array of messageTemplates
      const createMessageTemplateMock = jest
        .spyOn(controller, 'updateMessageTemplate')
        .mockResolvedValue(result);

      const programId = 1;
      const messageId = 1;
      const type = 'test1';
      const language = LanguageEnum.en;
      const body = {
        message: 'testing message',
        isWhatsappTemplate: false,
      };

      const response = await controller.updateMessageTemplate(
        { programId, type, language },
        body,
      );

      // Ensure that the response matches the expected result
      expect(response).toEqual(result);

      // Ensure that the createMessageTemplate method was called with the correct arguments
      expect(createMessageTemplateMock).toHaveBeenCalledWith(
        { programId, type, language },
        body,
      );
    });
  });
});
