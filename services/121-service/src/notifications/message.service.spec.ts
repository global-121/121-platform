import { MessageService } from './message.service';
import { LanguageEnum } from '../registration/enum/language.enum';
import { MessageContentType } from './enum/message-type.enum';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { SmsService } from './sms/sms.service';
import { TestBed } from '@automock/jest';
import { MessageJobDto, MessageProcessType } from './message-job.dto';
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
  let whatsappService: jest.Mocked<WhatsappService>;
  let smsService: jest.Mocked<SmsService>;
  let intersolveVoucherService: jest.Mocked<IntersolveVoucherService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(MessageService).compile();

    messageService = unit;
    whatsappService = unitRef.get(WhatsappService);
    smsService = unitRef.get(SmsService);
    intersolveVoucherService = unitRef.get(IntersolveVoucherService);

    jest
      .spyOn(messageService.registrationRepository, 'findOne')
      .mockImplementation(() =>
        Promise.resolve({ program: { id: 1 } } as RegistrationEntity),
      );
    jest
      .spyOn(messageService as any, 'getNotificationText')
      .mockImplementation(() => Promise.resolve('notificationText'));
  });

  it('should be defined', () => {
    expect(messageService).toBeDefined();
  });

  describe('Send a message', () => {
    it('if processType = sms it should call smsService', async () => {
      const messageJobSms = { ...messageJob };
      messageJobSms.messageProcessType = MessageProcessType.sms;
      messageJobSms.phoneNumber = '1234567890';

      await messageService.sendTextMessage(messageJobSms);

      expect(smsService.sendSms).toHaveBeenCalled();
    });
    it('if processType=tryWhatsapp it should call whatsappService', async () => {
      const messageJobTryWhatsapp = { ...messageJob };
      messageJobTryWhatsapp.messageProcessType = MessageProcessType.tryWhatsapp;
      messageJobTryWhatsapp.phoneNumber = '1234567890';
      messageJobTryWhatsapp.whatsappPhoneNumber = null;

      await messageService.sendTextMessage(messageJobTryWhatsapp);

      // storePendingMessageAndSendTemplate itself is private, so instead test underlying public method
      expect(whatsappService.sendWhatsapp).toHaveBeenCalled();
    });

    it('if processType=whatsappTemplateGeneric it should call whatsappService', async () => {
      const messageJobWhatsappCustom = { ...messageJob };
      messageJobWhatsappCustom.whatsappPhoneNumber = '1234567890';
      messageJobWhatsappCustom.messageContentType = MessageContentType.custom;
      messageJobWhatsappCustom.messageProcessType =
        MessageProcessType.whatsappTemplateGeneric;

      await messageService.sendTextMessage(messageJobWhatsappCustom);

      // storePendingMessageAndSendTemplate itself is private, so instead test underlying public method
      expect(whatsappService.sendWhatsapp).toHaveBeenCalled();
    });

    it('if processType=whatsappTemplateVoucher then it should call whatsappService and intersolveVoucherService', async () => {
      const messageJobWhatsappTemplated = { ...messageJob };
      messageJobWhatsappTemplated.whatsappPhoneNumber = '1234567890';
      messageJobWhatsappTemplated.messageContentType =
        MessageContentType.paymentTemplated;
      messageJobWhatsappTemplated.messageProcessType =
        MessageProcessType.whatsappTemplateVoucher;

      jest
        .spyOn(whatsappService, 'sendWhatsapp')
        .mockImplementation(() => Promise.resolve('SM1234567890'));

      await messageService.sendTextMessage(messageJobWhatsappTemplated);

      expect(whatsappService.sendWhatsapp).toHaveBeenCalled();
      expect(
        intersolveVoucherService.storeTransactionResult,
      ).toHaveBeenCalled();
    });
  });
});
