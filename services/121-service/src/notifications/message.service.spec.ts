import { MessageService } from './message.service';
import { LanguageEnum } from '../registration/enum/language.enum';
import { MessageContentType } from './enum/message-type.enum';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { SmsService } from './sms/sms.service';
import { TestBed } from '@automock/jest';
import { MessageJobDto, MessageProcessType } from './message-job.dto';
import { HttpStatus } from '@nestjs/common';
import { QueueMessageService } from './queue-message/queue-message.service';
import { RegistrationEntity } from '../registration/registration.entity';
import { IntersolveVoucherService } from '../payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';

const messageJob = {
  whatsappPhoneNumber: '1234567890',
  phoneNumber: '1234567890',
  preferredLanguage: LanguageEnum.en,
  referenceId: 'ref-test',
  programId: 1,
  message: 'test message',
  key: 'key',
  customData: {},
} as MessageJobDto;

describe('MessageService', () => {
  let messageService: MessageService;
  let queueMessageService: jest.Mocked<QueueMessageService>;
  let whatsappService: jest.Mocked<WhatsappService>;
  let smsService: jest.Mocked<SmsService>;
  let intersolveVoucherService: jest.Mocked<IntersolveVoucherService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(MessageService).compile();

    messageService = unit;
    queueMessageService = unitRef.get(QueueMessageService);
    whatsappService = unitRef.get(WhatsappService);
    smsService = unitRef.get(SmsService);
    intersolveVoucherService = unitRef.get(IntersolveVoucherService);
  });

  it('should be defined', () => {
    expect(messageService).toBeDefined();
  });

  // TODO: re-evaluate/update these tests based on latest code
  describe('Send a message', () => {
    it('if whatsapp-number and non-templated message type and no reply message, then it should call queueMessageService', async () => {
      const messageJobWhatsappCustom = { ...messageJob };
      messageJobWhatsappCustom.whatsappPhoneNumber = '1234567890';
      messageJobWhatsappCustom.messageContentType = MessageContentType.custom;

      jest
        .spyOn(messageService.registrationRepository, 'findOne')
        .mockImplementation(() =>
          Promise.resolve({ program: { id: 1 } } as RegistrationEntity),
        );
      jest
        .spyOn(messageService as any, 'getNotificationText')
        .mockImplementation(() => Promise.resolve('notificationText'));

      await messageService.sendTextMessage(messageJobWhatsappCustom);

      // storePendingMessageAndSendTemplate itself is private, so instead test underlying public method
      expect(queueMessageService.addMessageToQueue).toHaveBeenCalled();
      expect(smsService.sendSms).not.toHaveBeenCalled();
    });

    it('if whatsapp-number and templated or reply message, then it should call whatsappService', async () => {
      const messageJobWhatsappTemplated = { ...messageJob };
      messageJobWhatsappTemplated.whatsappPhoneNumber = '1234567890';
      messageJobWhatsappTemplated.messageContentType =
        MessageContentType.paymentTemplated;

      jest
        .spyOn(whatsappService, 'sendWhatsapp')
        .mockImplementation(() => Promise.resolve('SM1234567890'));

      await messageService.sendTextMessage(messageJobWhatsappTemplated);

      expect(whatsappService.sendWhatsapp).toHaveBeenCalled();
      expect(
        intersolveVoucherService.storeTransactionResult,
      ).toHaveBeenCalled();
      expect(smsService.sendSms).not.toHaveBeenCalled();
    });

    it('if no whatsapp, but tryWhatsapp=true and phone-number supplied, it should call queueMessageService', async () => {
      const messageJobTryWhatsapp = { ...messageJob };
      messageJobTryWhatsapp.messageProcessType = MessageProcessType.tryWhatsapp;
      messageJobTryWhatsapp.phoneNumber = '1234567890';
      messageJobTryWhatsapp.whatsappPhoneNumber = null;

      await messageService.sendTextMessage(messageJobTryWhatsapp);

      // trywhapp() and storePendingMessageAndSendTemplate() are private, so instead test underlying public method
      expect(queueMessageService.addMessageToQueue).toHaveBeenCalled();
      expect(smsService.sendSms).not.toHaveBeenCalled();
    });

    it('if processType = sms it should call smsService', async () => {
      const messageJobSms = { ...messageJob };
      messageJobSms.messageProcessType = MessageProcessType.sms; // TODO: is this still relevant this way?
      messageJobSms.phoneNumber = '1234567890';

      await messageService.sendTextMessage(messageJobSms);

      expect(smsService.sendSms).toHaveBeenCalled();
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
