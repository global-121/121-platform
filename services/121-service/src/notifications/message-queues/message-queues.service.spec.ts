import { TestBed } from '@automock/jest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  MessageJobDto,
  MessageProcessType,
} from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProcessNameMessage } from '@121-service/src/notifications/enum/process-names.enum';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { ProgramAttributesService } from '@121-service/src/program-attributes/program-attributes.service';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

describe('MessageQueuesService', () => {
  let queueMessageService: MessageQueuesService;
  let queuesService: QueuesRegistryService;
  let programAttributesService: ProgramAttributesService;
  let messageTemplateRepository: Repository<MessageTemplateEntity>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(MessageQueuesService)
      .mock(QueuesRegistryService)
      .using({
        createMessageSmallBulkQueue: {
          add: jest.fn(),
        },
      })
      .compile();

    queueMessageService = unit;
    queuesService = unitRef.get(QueuesRegistryService);
    programAttributesService = unitRef.get(ProgramAttributesService);
    messageTemplateRepository = unitRef.get(
      getRepositoryToken(MessageTemplateEntity) as any,
    );
  });

  it('should be defined', () => {
    expect(queueMessageService).toBeDefined();
  });

  it('should add message to queue', async () => {
    // Arrange
    const messageJob = {
      registrationId: 2,
      programId: 1,
      whatsappPhoneNumber: '1234567890',
      phoneNumber: '1234567890',
      preferredLanguage: RegistrationPreferredLanguage.en,
      referenceId: 'ref-test',
      message: 'test message',
      messageTemplateKey: 'messageTemplateKey',
      messageContentType: MessageContentType.custom,
      messageProcessType: MessageProcessType.whatsappTemplateGeneric,
      userId: 1,
    } satisfies MessageJobDto;

    // Act
    await queueMessageService.addMessageJob({
      ...messageJob,
      extendedMessageProcessType: messageJob.messageProcessType,
    });

    // Assert
    expect(queuesService.createMessageSmallBulkQueue.add).toHaveBeenCalledWith(
      ProcessNameMessage.send,
      {
        ...messageJob,
        customData: undefined,
        mediaUrl: undefined,
      },
    );
  });

  describe('getPlaceholdersInMessageText', () => {
    it('should get the placeholders from custom message text', async () => {
      // Arrange
      jest
        .spyOn(programAttributesService as any, 'getAttributes')
        .mockImplementation(() => {
          return [{ name: 'fullName' }, { name: 'namePartnerOrganization' }];
        });
      const messageText = 'Hello {{fullName}}, how are you?';
      const expectedPlaceholders = ['fullName'];

      // Act
      const result = await queueMessageService.getPlaceholdersInMessageText(
        2,
        messageText,
      );

      // Assert
      expect(result).toStrictEqual(expectedPlaceholders);
    });

    it('should get the placeholders from a message that comes from messageTemplateRepository', async () => {
      jest
        .spyOn(programAttributesService as any, 'getAttributes')
        .mockImplementation(() => {
          return [{ name: 'fullName' }, { name: 'namePartnerOrganization' }];
        });

      jest.spyOn(messageTemplateRepository, 'findOne').mockResolvedValue(
        Promise.resolve({
          message:
            'Hello {{fullName}}, how are you? Greetings from {{namePartnerOrganization}}',
          language: RegistrationPreferredLanguage.en,
          type: 'test',
          label: null,
          programId: 2,
          created: new Date(),
          updated: new Date(),
          isWhatsappTemplate: false,
          isSendMessageTemplate: true,
          id: 1,
        }),
      );

      // Arrange
      const messageTemplateKey = 'test';
      const expectedPlaceholders = ['fullName', 'namePartnerOrganization'];

      // Act
      const result = await queueMessageService.getPlaceholdersInMessageText(
        2,
        undefined,
        messageTemplateKey,
      );

      // Assert
      expect(result).toStrictEqual(expectedPlaceholders);
    });
  });
});
