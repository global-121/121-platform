import { MessageService } from './message.service';
// Assuming the entities are in the same directory
import { RegistrationViewEntity } from '../registration/registration-view.entity';
import { LanguageEnum } from '../registration/enum/language.enum';
import { MessageContentType } from './enum/message-type.enum';
import { ProcessName } from './enum/processor.names.enum';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { Queue } from 'bull';
import { SmsService } from './sms/sms.service';
import { DataSource } from 'typeorm';
import { TestBed } from '@automock/jest';
import { MessageJobDto } from './message-job.dto';
import { RegistrationEntity } from '../registration/registration.entity';
import { HttpStatus } from '@nestjs/common';

const messageJob = {
  whatsappPhoneNumber: '1234567890',
  phoneNumber: '1234567890',
  preferredLanguage: LanguageEnum.en,
  referenceId: 'ref-test',
  programId: 1,
  message: 'test message',
  key: 'key',
  tryWhatsApp: true,
  messageContentType: MessageContentType.custom,
} as MessageJobDto;

describe('MessageService', () => {
  let messageService: MessageService;
  let whatsappService: jest.Mocked<WhatsappService>;
  let smsService: jest.Mocked<SmsService>;
  let dataSource: jest.Mocked<DataSource>;
  let messageQueue: jest.Mocked<Queue>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(MessageService).compile();

    messageService = unit;
    whatsappService = unitRef.get(WhatsappService);
    smsService = unitRef.get(SmsService);
    dataSource = unitRef.get(DataSource);
    messageQueue = unitRef.get('BullQueue_message');
  });

  it('should be defined', () => {
    expect(messageService).toBeDefined();
  });

  describe('Adding messages to a queue', () => {
    it('should add message to queue registration view', async () => {
      const registration = new RegistrationViewEntity();
      registration.id = 2;
      registration.referenceId = 'refview';
      registration.preferredLanguage = LanguageEnum.fr;
      registration.phoneNumber = '234567891';

      const messageJobView = {
        ...messageJob,
      };
      messageJobView.whatsappPhoneNumber = registration['whatsappPhoneNumber'];
      messageJobView.phoneNumber = registration.phoneNumber;
      messageJobView.preferredLanguage = registration.preferredLanguage;
      messageJobView.id = registration.id;
      messageJobView.referenceId = registration.referenceId;
      await messageService.addMessageToQueue(
        registration,
        1,
        'test message',
        'key',
        true,
        MessageContentType.custom,
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

      const expectedMessageJobView = {
        ...messageJob,
      };
      expectedMessageJobView.whatsappPhoneNumber = whatsappNumber;
      expectedMessageJobView.phoneNumber = registration.phoneNumber;
      expectedMessageJobView.preferredLanguage = registration.preferredLanguage;
      expectedMessageJobView.id = registration.id;
      expectedMessageJobView.referenceId = registration.referenceId;

      const mockGetRegistrationDataValueByName = jest
        .spyOn(registration, 'getRegistrationDataValueByName')
        .mockImplementation(() => Promise.resolve(whatsappNumber));

      await messageService.addMessageToQueue(
        registration,
        1,
        'test message',
        'key',
        true,
        MessageContentType.custom,
      );

      expect(messageQueue.add).toHaveBeenCalledWith(
        ProcessName.send,
        expectedMessageJobView,
      );

      // Check if the mock was called
      expect(mockGetRegistrationDataValueByName).toHaveBeenCalled();
    });
  });

  describe('Send a a message', () => {
    it('should throw an error if neither a message nor a key is supplied', async () => {
      const messageJobBadRequest = { ...messageJob };
      messageJobBadRequest.message = null;
      messageJobBadRequest.key = null;

      await expect(
        messageService.sendTextMessage(messageJobBadRequest),
      ).rejects.toHaveProperty('status', HttpStatus.BAD_REQUEST);

      expect(whatsappService.queueMessageSendTemplate).not.toHaveBeenCalled();
      expect(smsService.sendSms).not.toHaveBeenCalled();
    });

    it('should call whatsappService.queueMessageSendTemplate if a whatsapp number is supplied', async () => {
      const messageJobWhatsapp = { ...messageJob };
      messageJobWhatsapp.whatsappPhoneNumber = '1234567890';

      await messageService.sendTextMessage(messageJobWhatsapp);

      expect(whatsappService.queueMessageSendTemplate).toHaveBeenCalled();
      expect(smsService.sendSms).not.toHaveBeenCalled();
    });

    it('should call whatsappService if tryWhatsApp is true and a phone number is supplied', async () => {
      const messageJobTryWhatsapp = { ...messageJob };
      messageJobTryWhatsapp.tryWhatsApp = true;
      messageJobTryWhatsapp.phoneNumber = '1234567890';
      messageJobTryWhatsapp.whatsappPhoneNumber = null;

      // We cannot test if trywhapp is called because it is a private method
      expect(whatsappService.queueMessageSendTemplate).toHaveBeenCalled();
      expect(smsService.sendSms).not.toHaveBeenCalled();
    });

    it('should throw an error if no phonenumber or whatsappnumber is provided', async () => {
      const messageJobNoNumber = { ...messageJob };

      messageJobNoNumber.phoneNumber = null;
      messageJobNoNumber.whatsappPhoneNumber = null;

      await expect(
        messageService.sendTextMessage(messageJobNoNumber),
      ).rejects.toHaveProperty('status', HttpStatus.BAD_REQUEST);
    });
  });
});
