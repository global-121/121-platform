import { TestBed } from '@automock/jest';
import { IntersolveVoucherService } from '../payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { RegistrationEntity } from '../registration/registration.entity';
import { LanguageEnum } from '../shared/enum/language.enums';
import { StatusEnum } from '../shared/enum/status.enum';
import { AzureLogService } from '../shared/services/azure-log.service';
import { MessageContentType } from './enum/message-type.enum';
import { MessageJobDto, MessageProcessType } from './message-job.dto';
import { MessageService } from './message.service';
import { SmsService } from './sms/sms.service';
import { WhatsappService } from './whatsapp/whatsapp.service';

const defaultMessageJob = {
  whatsappPhoneNumber: '1234567890',
  phoneNumber: '1234567890',
  preferredLanguage: LanguageEnum.en,
  referenceId: 'ref-test',
  programId: 1,
  message: 'test message',
  messageTemplateKey: 'messageTemplateKey',
  customData: {},
} as MessageJobDto;
const mockDefaultNotificationText = 'default notification';
let getNotificationTextMock: jest.SpyInstance;

describe('MessageService', () => {
  let messageService: MessageService;
  let whatsappService: jest.Mocked<WhatsappService>;
  let smsService: jest.Mocked<SmsService>;
  let intersolveVoucherService: jest.Mocked<IntersolveVoucherService>;
  let azureLogService: jest.Mocked<AzureLogService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(MessageService).compile();

    messageService = unit;
    whatsappService = unitRef.get(WhatsappService);
    smsService = unitRef.get(SmsService);
    intersolveVoucherService = unitRef.get(IntersolveVoucherService);
    azureLogService = unitRef.get(AzureLogService);

    jest
      .spyOn(messageService.registrationRepository, 'findOne')
      .mockResolvedValue({ program: { id: 1 } } as RegistrationEntity);

    jest.spyOn(console, 'log').mockImplementation();

    getNotificationTextMock = jest
      .spyOn(messageService as any, 'getNotificationText')
      .mockResolvedValue(mockDefaultNotificationText);
  });

  it('should be defined', () => {
    expect(messageService).toBeDefined();
  });

  it('should log an Error if sendTextMessage fails', async () => {
    // Arrange
    const messageJobSms = {
      ...defaultMessageJob,
      messageProcessType: MessageProcessType.sms,
      phoneNumber: '9876543210',
    };
    smsService.sendSms.mockRejectedValueOnce('test');

    // Act
    try {
      await messageService.sendTextMessage(messageJobSms);
    } catch {
      // Ignore the error thrown
    }

    // Assert
    expect(smsService.sendSms).toHaveBeenCalledTimes(1);
    expect(smsService.sendSms).toHaveBeenCalledWith(
      messageJobSms.message,
      messageJobSms.phoneNumber,
      messageJobSms.registrationId,
      messageJobSms.messageContentType,
      messageJobSms.messageProcessType,
    );
    expect(azureLogService.logError).toHaveBeenCalled();
  });

  describe('Send a message', () => {
    it('should call smsService when processType = sms', async () => {
      // Arrange
      const testMessageJob = {
        ...defaultMessageJob,
        messageProcessType: MessageProcessType.sms,
        phoneNumber: '111222333',
      };

      // Act
      await messageService.sendTextMessage(testMessageJob);

      // Assert
      expect(getNotificationTextMock).toHaveBeenCalledTimes(0);
      expect(smsService.sendSms).toHaveBeenCalledTimes(1);
      expect(smsService.sendSms).toHaveBeenCalledWith(
        testMessageJob.message,
        testMessageJob.phoneNumber,
        testMessageJob.registrationId,
        testMessageJob.messageContentType,
        testMessageJob.messageProcessType,
      );
    });

    it('should call whatsappService when processType = tryWhatsapp', async () => {
      // Arrange
      const testMessageJob = {
        ...defaultMessageJob,
        messageProcessType: MessageProcessType.tryWhatsapp,
        phoneNumber: '999888777',
        whatsappPhoneNumber: null,
      };
      const testNotificationText = 'WhatsApp Generic Message';
      getNotificationTextMock = jest
        .spyOn(messageService as any, 'getNotificationText')
        .mockResolvedValue(testNotificationText);

      // Act
      await messageService.sendTextMessage(testMessageJob);

      // Assert
      expect(getNotificationTextMock).toHaveBeenCalledTimes(1);
      expect(whatsappService.sendWhatsapp).toHaveBeenCalledTimes(1);
      expect(whatsappService.sendWhatsapp).toHaveBeenCalledWith(
        testNotificationText,
        testMessageJob.phoneNumber,
        null,
        testMessageJob.registrationId,
        MessageContentType.genericTemplated,
        MessageProcessType.whatsappTemplateGeneric,
      );
      expect(smsService.sendSms).toHaveBeenCalledTimes(0);
    });

    it('should call whatsappService when processType = whatsappTemplateGeneric', async () => {
      // Arrange
      const testMessageJob = {
        ...defaultMessageJob,
        messageProcessType: MessageProcessType.whatsappTemplateGeneric,
        messageContentType: MessageContentType.custom,
        whatsappPhoneNumber: '012343210',
      };
      const testNotificationText = 'WhatsApp Generic Message';
      getNotificationTextMock = jest
        .spyOn(messageService as any, 'getNotificationText')
        .mockResolvedValue(testNotificationText);

      // Act
      await messageService.sendTextMessage(testMessageJob);

      // Assert
      expect(getNotificationTextMock).toHaveBeenCalledTimes(1);
      expect(whatsappService.sendWhatsapp).toHaveBeenCalledTimes(1);
      expect(whatsappService.sendWhatsapp).toHaveBeenCalledWith(
        testNotificationText,
        testMessageJob.whatsappPhoneNumber,
        null,
        testMessageJob.registrationId,
        MessageContentType.genericTemplated,
        testMessageJob.messageProcessType,
      );
    });

    it('should call whatsappService and intersolveVoucherService when processType = whatsappTemplateVoucher', async () => {
      // Arrange
      const testMessageJob = {
        ...defaultMessageJob,
        messageProcessType: MessageProcessType.whatsappTemplateVoucher,
        messageContentType: MessageContentType.paymentTemplated,
        whatsappPhoneNumber: '94287277',
        customData: {
          payment: 1,
          amount: 123,
          intersolveVoucherId: 456,
        },
      };
      const testMessageID = 'SM' + testMessageJob.whatsappPhoneNumber;
      jest
        .spyOn(whatsappService, 'sendWhatsapp')
        .mockResolvedValueOnce(testMessageID);

      // Act
      await messageService.sendTextMessage(testMessageJob);

      // Assert
      expect(whatsappService.sendWhatsapp).toHaveBeenCalledTimes(1);
      expect(whatsappService.sendWhatsapp).toHaveBeenCalledWith(
        testMessageJob.message,
        testMessageJob.whatsappPhoneNumber,
        undefined,
        testMessageJob.registrationId,
        testMessageJob.messageContentType,
        testMessageJob.messageProcessType,
      );

      expect(
        intersolveVoucherService.updateTransactionBasedTwilioMessageCreate,
      ).toHaveBeenCalledTimes(1);
      expect(
        intersolveVoucherService.updateTransactionBasedTwilioMessageCreate,
      ).toHaveBeenCalledWith(
        testMessageJob.customData.payment,
        testMessageJob.registrationId,
        StatusEnum.waiting,
        1,
        testMessageID,
        null,
      );
    });
  });
});
