import { TestBed } from '@automock/jest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  MessageJobDto,
  MessageProcessType,
  MessageProcessTypeExtension,
} from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProcessNameMessage } from '@121-service/src/notifications/enum/process-names.enum';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { ProgramRegistrationAttributesService } from '@121-service/src/program-registration-attributes/program-registration-attributes.service';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

describe('MessageQueuesService', () => {
  let queueMessageService: MessageQueuesService;
  let queuesService: QueuesRegistryService;
  let programRegistrationAttributesService: ProgramRegistrationAttributesService;
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
    programRegistrationAttributesService = unitRef.get(
      ProgramRegistrationAttributesService,
    );
    messageTemplateRepository = unitRef.get(
      getRepositoryToken(MessageTemplateEntity) as any,
    );
  });

  it('should be defined', () => {
    expect(queueMessageService).toBeDefined();
  });

  const baseMessageJob = {
    registrationId: 2,
    programId: 1,
    phoneNumber: '1234567890',
    preferredLanguage: RegistrationPreferredLanguage.en,
    referenceId: 'ref-test',
    message: 'test message',
    messageTemplateKey: 'messageTemplateKey',
    messageContentType: MessageContentType.custom,
    userId: 1,
  };

  it('should add message to queue', async () => {
    // Arrange
    const messageJob = {
      ...baseMessageJob,
      whatsappPhoneNumber: '1234567890',
      messageProcessType: MessageProcessType.whatsappTemplateGeneric,
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

  it('should resolve smsOrWhatsappTemplateGeneric to whatsappTemplateGeneric when whatsappPhoneNumber is set', async () => {
    // Arrange
    const whatsappPhoneNumber = '1234567890';

    // Act
    await queueMessageService.addMessageJob({
      ...baseMessageJob,
      whatsappPhoneNumber,
      extendedMessageProcessType:
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
    });

    // Assert
    expect(queuesService.createMessageSmallBulkQueue.add).toHaveBeenCalledWith(
      ProcessNameMessage.send,
      expect.objectContaining({
        messageProcessType: MessageProcessType.whatsappTemplateGeneric,
        whatsappPhoneNumber,
      }),
    );
  });

  it('should resolve smsOrWhatsappTemplateGeneric to sms when whatsappPhoneNumber is not set', async () => {
    // Act
    await queueMessageService.addMessageJob({
      ...baseMessageJob,
      whatsappPhoneNumber: undefined,
      extendedMessageProcessType:
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
    });

    // Assert
    expect(queuesService.createMessageSmallBulkQueue.add).toHaveBeenCalledWith(
      ProcessNameMessage.send,
      expect.objectContaining({
        messageProcessType: MessageProcessType.sms,
        whatsappPhoneNumber: undefined,
      }),
    );
  });

  describe('getPlaceholdersInMessageText', () => {
    it('should get the placeholders from custom message text', async () => {
      // Arrange
      jest
        .spyOn(programRegistrationAttributesService as any, 'getAttributes')
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
        .spyOn(programRegistrationAttributesService as any, 'getAttributes')
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
