import { Test } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { MessageTemplateController } from './message-template.controller';
import { MessageTemplateService } from './message-template.service';
import { MessageTemplateEntity } from './message-template.entity';

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
      // Arrange
      const programId = 1;
      const createMessageTemplateMock = jest
        .spyOn(controller, 'createMessageTemplate')
        .mockResolvedValue();
      const messageTemplate = {
        type: 'dsadsaasd12123dsa',
        language: 'test1',
        message: 'en',
        isWhatsappTemplate: true,
      };

      // Act
      const response = await controller.createMessageTemplate(
        programId,
        messageTemplate,
      );

      // Assert
      expect(response).toEqual(undefined);
      expect(createMessageTemplateMock).toHaveBeenCalledWith(
        programId,
        messageTemplate,
      );
    });

    it('should get all message template by programId', async () => {
      // Arrange
      const testProgramId = 1;
      const result: MessageTemplateEntity[] = [
        {
          id: 1,
          created: new Date(),
          updated: new Date(),
          type: 'dsadsaasd12123dsa',
          language: 'test1',
          message: 'en',
          isWhatsappTemplate: true,
          programId: testProgramId,
        },
      ];
      const createMessageTemplateMock = jest
        .spyOn(controller, 'getMessageTemplatesByProgramId')
        .mockResolvedValue(result);

      const params = {
        programId: testProgramId,
      };

      // Act
      const response = await controller.getMessageTemplatesByProgramId(params);

      // Assert
      expect(response).toEqual(result);
      expect(createMessageTemplateMock).toHaveBeenCalledWith(params);
    });

    it('should update message template by id', async () => {
      // Arrange
      const testProgramId = 1;
      const testMessageId = 1;
      const result: MessageTemplateEntity = {
        id: testMessageId,
        created: new Date(),
        updated: new Date(),
        type: 'test1',
        language: 'en',
        message: 'testing message',
        isWhatsappTemplate: false,
        programId: testProgramId,
      };
      const createMessageTemplateMock = jest
        .spyOn(controller, 'updateMessageTemplate')
        .mockResolvedValue(result);

      const body = {
        type: 'test1',
        language: 'en',
        message: 'testing message',
        isWhatsappTemplate: false,
      };

      // Act
      const response = await controller.updateMessageTemplate(
        testProgramId,
        testMessageId,
        body,
      );

      // Assert
      expect(response).toEqual(result);
      expect(createMessageTemplateMock).toHaveBeenCalledWith(
        testProgramId,
        testMessageId,
        body,
      );
    });
  });
});
