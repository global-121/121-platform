import { TestBed } from '@automock/jest';
import { Queue } from 'bull';
import { LanguageEnum } from '../../registration/enum/language.enum';
import { RegistrationViewEntity } from '../../registration/registration-view.entity';
import { RegistrationEntity } from '../../registration/registration.entity';
import { getQueueName } from '../../utils/unit-test.helpers';
import { DEFAULT_QUEUE_CREATE_MESSAGE } from '../enum/message-queue-mapping.const';
import { MessageContentType } from '../enum/message-type.enum';
import { ProcessName } from '../enum/queue.names.enum';
import { MessageJobDto, MessageProcessType } from '../message-job.dto';
import { QueueMessageService } from './queue-message.service';

const defaultMessageJob = {
  whatsappPhoneNumber: '1234567890',
  phoneNumber: '1234567890',
  preferredLanguage: LanguageEnum.en,
  referenceId: 'ref-test',
  message: 'test message',
  key: 'key',
  messageContentType: MessageContentType.custom,
} as MessageJobDto;

describe('QueueMessageService', () => {
  let queueMessageService: QueueMessageService;
  let messageQueue: jest.Mocked<Queue>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(QueueMessageService).compile();

    queueMessageService = unit;
    messageQueue = unitRef.get(getQueueName(DEFAULT_QUEUE_CREATE_MESSAGE));
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
    registration['whatsappPhoneNumber'] = '0987654321';

    // Act
    await queueMessageService.addMessageToQueue(
      registration,
      'test message',
      'key',
      MessageContentType.custom,
      MessageProcessType.whatsappTemplateGeneric,
    );

    // Assert
    expect(messageQueue.add).toHaveBeenCalledWith(ProcessName.send, {
      ...defaultMessageJob,
      whatsappPhoneNumber: registration['whatsappPhoneNumber'],
      phoneNumber: registration.phoneNumber,
      preferredLanguage: registration.preferredLanguage,
      registrationId: registration.id,
      programId: registration.programId,
      referenceId: registration.referenceId,
      customData: undefined,
      mediaUrl: undefined,
      messageProcessType: MessageProcessType.whatsappTemplateGeneric,
    });
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
      .spyOn(registration, 'getRegistrationDataValueByName')
      .mockResolvedValue(whatsappNumber);

    // Act
    await queueMessageService.addMessageToQueue(
      registration,
      'test message',
      'key',
      MessageContentType.custom,
      MessageProcessType.whatsappTemplateGeneric,
    );

    // Assert
    expect(mockGetRegistrationDataValueByName).toHaveBeenCalledTimes(1);
    expect(messageQueue.add).toHaveBeenCalledWith(ProcessName.send, {
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
    });
  });
});
