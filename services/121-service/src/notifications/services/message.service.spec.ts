import { TestBed } from '@automock/jest';

import { IntersolveVoucherService } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/services/intersolve-voucher.service';
import {
  MessageJobDto,
  MessageProcessType,
} from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { MessageService } from '@121-service/src/notifications/services/message.service';
import { SmsService } from '@121-service/src/notifications/sms/sms.service';
import { WhatsappService } from '@121-service/src/notifications/whatsapp/whatsapp.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

const defaultMessageJob = {
  whatsappPhoneNumber: '1234567890',
  phoneNumber: '1234567890',
  preferredLanguage: RegistrationPreferredLanguage.en,
  referenceId: 'ref-test',
  programId: 1,
  message: 'test message',
  messageTemplateKey: 'messageTemplateKey',
  customData: {},
  userId: 1,
} as MessageJobDto;
const mockDefaultNotificationText = 'default notification';
const mockTransactionId = 1;
const mockProgramFspConfigurationId = 2;
const mockIntersolveVoucherId = 3;
let getMessageTemplateForLanguageOrFallback: jest.SpyInstance;

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
      .spyOn(messageService.registrationRepository, 'findOneOrFail')
      .mockResolvedValue({ program: { id: 1 } } as RegistrationEntity);

    jest.spyOn(console, 'log').mockImplementation();

    getMessageTemplateForLanguageOrFallback = jest
      .spyOn(messageService as any, 'getMessageTemplateForLanguageOrFallback')
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
      messageJobSms.userId,
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
      expect(getMessageTemplateForLanguageOrFallback).toHaveBeenCalledTimes(0);
      expect(smsService.sendSms).toHaveBeenCalledTimes(1);
      expect(smsService.sendSms).toHaveBeenCalledWith(
        testMessageJob.message,
        testMessageJob.userId,
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
        whatsappPhoneNumber: undefined,
      };
      const messageTemplateObject = {
        contentSid: 'h123',
      };
      getMessageTemplateForLanguageOrFallback = jest
        .spyOn(messageService as any, 'getMessageTemplateForLanguageOrFallback')
        .mockResolvedValue(messageTemplateObject);

      // Act
      await messageService.sendTextMessage(testMessageJob);

      // Assert
      expect(getMessageTemplateForLanguageOrFallback).toHaveBeenCalledTimes(1);
      expect(whatsappService.sendWhatsapp).toHaveBeenCalledTimes(1);
      expect(whatsappService.sendWhatsapp).toHaveBeenCalledWith({
        message: undefined,
        contentSid: messageTemplateObject.contentSid,
        userId: testMessageJob.userId,
        recipientPhoneNr: testMessageJob.phoneNumber,
        registrationId: testMessageJob.registrationId,
        messageContentType: MessageContentType.genericTemplated,
        messageProcessType: MessageProcessType.whatsappTemplateGeneric,
      });
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
      const messageTemplateObject = {
        contentSid: 'h123',
      };
      getMessageTemplateForLanguageOrFallback = jest
        .spyOn(messageService as any, 'getMessageTemplateForLanguageOrFallback')
        .mockResolvedValue(messageTemplateObject);

      // Act
      await messageService.sendTextMessage(testMessageJob);

      // Assert
      expect(getMessageTemplateForLanguageOrFallback).toHaveBeenCalledTimes(1);
      expect(whatsappService.sendWhatsapp).toHaveBeenCalledTimes(1);
      expect(whatsappService.sendWhatsapp).toHaveBeenCalledWith({
        message: undefined,
        contentSid: messageTemplateObject.contentSid,
        userId: testMessageJob.userId,
        recipientPhoneNr: testMessageJob.whatsappPhoneNumber,
        registrationId: testMessageJob.registrationId,
        messageContentType: MessageContentType.genericTemplated,
        messageProcessType: testMessageJob.messageProcessType,
      });
    });

    it('should call whatsappService and intersolveVoucherService when processType = whatsappTemplateVoucher', async () => {
      // Arrange
      const contentSid = 'h456';

      const testMessageJob = {
        ...defaultMessageJob,
        message: undefined,
        contentSid,
        messageProcessType: MessageProcessType.whatsappTemplateVoucher,
        messageContentType: MessageContentType.paymentTemplated,
        whatsappPhoneNumber: '94287277',
        customData: {
          transactionData: {
            transactionId: mockTransactionId,
            programFspConfigurationId: mockProgramFspConfigurationId,
          },
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
      expect(whatsappService.sendWhatsapp).toHaveBeenCalledWith({
        contentSid,
        userId: testMessageJob.userId,
        recipientPhoneNr: testMessageJob.whatsappPhoneNumber,
        registrationId: testMessageJob.registrationId,
        messageContentType: testMessageJob.messageContentType,
        messageProcessType: testMessageJob.messageProcessType,
      });

      expect(
        intersolveVoucherService.updateTransactionProgressBasedOnInitialMessage,
      ).toHaveBeenCalledTimes(1);
      expect(
        intersolveVoucherService.updateTransactionProgressBasedOnInitialMessage,
      ).toHaveBeenCalledWith({
        errorMessage: undefined,
        messageSid: testMessageID,
        newTransactionStatus: TransactionStatusEnum.waiting,
        programFspConfigurationId: mockProgramFspConfigurationId,
        transactionId: mockTransactionId,
        userId: defaultMessageJob.userId,
      });
    });
    it('should call whatsappService and intersolveVoucherService when processType = whatsappPendingVoucher and message = empty string', async () => {
      // Arrange
      const mediaUrl = 'https://test.com';

      const testMessageJob = {
        ...defaultMessageJob,
        message: '',
        messageTemplateKey: undefined,
        mediaUrl,
        messageProcessType: MessageProcessType.whatsappPendingVoucher,
        messageContentType: MessageContentType.paymentTemplated,
        whatsappPhoneNumber: '94287277',
        customData: {
          transactionData: {
            transactionId: mockTransactionId,
            intersolveVoucherId: mockIntersolveVoucherId,
          },
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
      expect(whatsappService.sendWhatsapp).toHaveBeenCalledWith({
        message: '', // it's important that this stays empty
        userId: testMessageJob.userId,
        recipientPhoneNr: testMessageJob.whatsappPhoneNumber,
        mediaUrl: testMessageJob.mediaUrl,
        registrationId: testMessageJob.registrationId,
        messageContentType: testMessageJob.messageContentType,
        messageProcessType: testMessageJob.messageProcessType,
      });

      expect(
        intersolveVoucherService.updateTransactionProgressBasedOnVoucherMessage,
      ).toHaveBeenCalledTimes(1);
      expect(
        intersolveVoucherService.updateTransactionProgressBasedOnVoucherMessage,
      ).toHaveBeenCalledWith({
        errorMessage: null,
        intersolveVoucherId: mockIntersolveVoucherId,
        messageSid: testMessageID,
        newTransactionStatus: TransactionStatusEnum.success,
        transactionId: mockTransactionId,
      });
    });
  });
});
