import { QueueMessageService } from './queue-message.service';
import { RegistrationViewEntity } from '../../registration/registration-view.entity';
import { LanguageEnum } from '../../registration/enum/language.enum';
import { MessageContentType } from '../enum/message-type.enum';
import { ProcessName } from '../enum/processor.names.enum';
import { Queue } from 'bull';
import { TestBed } from '@automock/jest';
import { MessageJobDto, MessageProccessType } from '../message-job.dto';
import { RegistrationEntity } from '../../registration/registration.entity';

const messageJob = {
  whatsappPhoneNumber: '1234567890',
  phoneNumber: '1234567890',
  preferredLanguage: LanguageEnum.en,
  referenceId: 'ref-test',
  message: 'test message',
  key: 'key',
  tryWhatsApp: true,
  messageContentType: MessageContentType.custom,
} as MessageJobDto;

describe('QueueMessageService', () => {
  let queueMessageService: QueueMessageService;
  let messageQueue: jest.Mocked<Queue>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(QueueMessageService).compile();

    queueMessageService = unit;
    messageQueue = unitRef.get('BullQueue_message');
  });

  it('should be defined', () => {
    expect(queueMessageService).toBeDefined();
  });
  it('should add message to queue registration view', async () => {
    const registration = new RegistrationViewEntity();
    registration.id = 2;
    registration.referenceId = 'refview';
    registration.preferredLanguage = LanguageEnum.fr;
    registration.phoneNumber = '234567891';
    registration.programId = 1;
    registration['whatsappPhoneNumber'] = '0987654321';

    const messageJobView = {
      ...messageJob,
    };
    messageJobView.whatsappPhoneNumber = registration['whatsappPhoneNumber'];
    messageJobView.phoneNumber = registration.phoneNumber;
    messageJobView.preferredLanguage = registration.preferredLanguage;
    messageJobView.id = registration.id;
    messageJobView.programId = registration.programId;
    messageJobView.referenceId = registration.referenceId;
    messageJobView.customData = undefined;
    messageJobView.mediaUrl = undefined;

    await queueMessageService.addMessageToQueue(
      registration,
      'test message',
      'key',
      true,
      MessageContentType.custom,
      MessageProccessType.whatsappTemplateGeneric,
    );

    expect(messageQueue.add).toHaveBeenCalledWith(
      ProcessName.send,
      messageJobView,
    );
  });

  it('should add message to queue registration entity', async () => {
    const whatsappNumber = '0987654321';
    const registration = new RegistrationEntity();
    registration.id = 1;
    registration.referenceId = 'ref';
    registration.preferredLanguage = LanguageEnum.en;
    registration.phoneNumber = '1234567890';
    registration.programId = 1;

    const expectedMessageJobView = {
      ...messageJob,
    };
    expectedMessageJobView.whatsappPhoneNumber = whatsappNumber;
    expectedMessageJobView.phoneNumber = registration.phoneNumber;
    expectedMessageJobView.preferredLanguage = registration.preferredLanguage;
    expectedMessageJobView.id = registration.id;
    expectedMessageJobView.referenceId = registration.referenceId;
    expectedMessageJobView.programId = registration.programId;
    expectedMessageJobView.customData = undefined;
    expectedMessageJobView.mediaUrl = undefined;

    const mockGetRegistrationDataValueByName = jest
      .spyOn(registration, 'getRegistrationDataValueByName')
      .mockImplementation(() => Promise.resolve(whatsappNumber));

    await queueMessageService.addMessageToQueue(
      registration,
      'test message',
      'key',
      true,
      MessageContentType.custom,
      MessageProccessType.whatsappTemplateGeneric,
    );

    expect(messageQueue.add).toHaveBeenCalledWith(
      ProcessName.send,
      expectedMessageJobView,
    );

    // Check if the mock was called
    expect(mockGetRegistrationDataValueByName).toHaveBeenCalled();
  });
});
