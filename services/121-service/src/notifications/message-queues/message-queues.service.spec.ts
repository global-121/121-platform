import { TestBed } from '@automock/jest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProcessNameMessage } from '@121-service/src/notifications/enum/process-names.enum';
import {
  MessageJobDto,
  MessageProcessType,
} from '@121-service/src/notifications/message-job.dto';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { ProgramAttributesService } from '@121-service/src/program-attributes/program-attributes.service';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { DefaultRegistrationDataAttributeNames } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

const defaultMessageJob = {
  whatsappPhoneNumber: '1234567890',
  phoneNumber: '1234567890',
  preferredLanguage: LanguageEnum.en,
  referenceId: 'ref-test',
  message: 'test message',
  messageTemplateKey: 'messageTemplateKey',
  messageContentType: MessageContentType.custom,
  userId: 1,
} as MessageJobDto;

describe('MessageQueuesService', () => {
  let queueMessageService: MessageQueuesService;
  let queuesService: QueuesRegistryService;
  let programAttributesService: ProgramAttributesService;
  let messageTemplateRepository: Repository<MessageTemplateEntity>;
  let registrationDataService: RegistrationDataService;

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
    registrationDataService = unitRef.get(RegistrationDataService);
    messageTemplateRepository = unitRef.get(
      getRepositoryToken(MessageTemplateEntity) as any,
    );
  });

  it('should be defined', () => {
    expect(queueMessageService).toBeDefined();
  });

  it('should add message to queue registration view', async () => {
    // Arrange
    const registration = new RegistrationViewEntity();
    registration.id = 2;
    registration.referenceId = 'refview';
    registration.preferredLanguage = LanguageEnum.fr;
    registration.phoneNumber = '234567891';
    registration.programId = 1;
    registration[DefaultRegistrationDataAttributeNames.whatsappPhoneNumber] =
      '0987654321';

    // Act
    await queueMessageService.addMessageJob({
      registration,
      message: 'test message',
      messageTemplateKey: defaultMessageJob.messageTemplateKey,
      messageContentType: MessageContentType.custom,
      messageProcessType: MessageProcessType.whatsappTemplateGeneric,
      userId: defaultMessageJob.userId,
    });

    // Assert
    expect(queuesService.createMessageSmallBulkQueue.add).toHaveBeenCalledWith(
      ProcessNameMessage.send,
      {
        ...defaultMessageJob,
        whatsappPhoneNumber:
          registration[
            DefaultRegistrationDataAttributeNames.whatsappPhoneNumber
          ],
        phoneNumber: registration.phoneNumber,
        preferredLanguage: registration.preferredLanguage,
        registrationId: registration.id,
        programId: registration.programId,
        referenceId: registration.referenceId,
        customData: undefined,
        mediaUrl: undefined,
        messageProcessType: MessageProcessType.whatsappTemplateGeneric,
      },
    );
  });

  it('should add message to queue registration entity', async () => {
    // Arrange
    const whatsappNumber = '0987654321';
    const registration = new RegistrationEntity();
    registration.id = 1;
    registration.referenceId = 'ref';
    registration.preferredLanguage = LanguageEnum.en;
    registration.phoneNumber = '1234567890';
    registration.programId = 1;

    const mockGetRegistrationDataValueByName = jest
      .spyOn(registrationDataService, 'getRegistrationDataValueByName')
      .mockResolvedValue(whatsappNumber);

    // Act
    await queueMessageService.addMessageJob({
      registration,
      message: 'test message',
      messageTemplateKey: defaultMessageJob.messageTemplateKey,
      messageContentType: MessageContentType.custom,
      messageProcessType: MessageProcessType.whatsappTemplateGeneric,
      userId: defaultMessageJob.userId,
    });

    // Assert
    expect(mockGetRegistrationDataValueByName).toHaveBeenCalledTimes(1);
    expect(queuesService.createMessageSmallBulkQueue.add).toHaveBeenCalledWith(
      ProcessNameMessage.send,
      {
        ...defaultMessageJob,
        whatsappPhoneNumber: whatsappNumber,
        phoneNumber: registration.phoneNumber,
        preferredLanguage: registration.preferredLanguage,
        registrationId: registration.id,
        referenceId: registration.referenceId,
        programId: registration.programId,
        customData: undefined,
        mediaUrl: undefined,
        messageProcessType: MessageProcessType.whatsappTemplateGeneric,
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
          language: LanguageEnum.en,
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
