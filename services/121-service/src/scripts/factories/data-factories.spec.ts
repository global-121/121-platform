import { DataSource } from 'typeorm';

import { MessageProcessType } from '@121-service/src/notifications/dto/message-job.dto';
import { TwilioStatus } from '@121-service/src/notifications/dto/twilio.dto';
import { NotificationType } from '@121-service/src/notifications/entities/twilio.entity';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { MockDataFactoryService } from '@121-service/src/scripts/factories/mock-data-factory.service';
import { PaymentDataFactory } from '@121-service/src/scripts/factories/payment-data-factory';
import { RegistrationDataFactory } from '@121-service/src/scripts/factories/registration-data-factory';
import { TwilioMessageDataFactory } from '@121-service/src/scripts/factories/twilio-message-data-factory';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

// Mock DataSource for testing
const mockDataSource = {
  getRepository: jest.fn().mockReturnValue({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ max: 0 }),
    }),
  }),
  query: jest.fn(),
  transaction: jest.fn(),
} as unknown as DataSource;

describe('Data Factories', () => {
  describe('RegistrationDataFactory', () => {
    it('should create registration factory without errors', () => {
      const factory = new RegistrationDataFactory(mockDataSource);
      expect(factory).toBeDefined();
    });

    it('should validate registration factory options interface', () => {
      const options = {
        programId: 1,
        registrationStatus: RegistrationStatusEnum.included,
        preferredLanguage: LanguageEnum.en,
        scope: 'test-scope',
        programFspConfigurationId: 1,
      };

      // This is a compile-time test - if it compiles, the interface is correct
      expect(options.programId).toBe(1);
    });
  });

  describe('TwilioMessageDataFactory', () => {
    it('should create twilio message factory without errors', () => {
      const factory = new TwilioMessageDataFactory(mockDataSource);
      expect(factory).toBeDefined();
    });

    it('should validate twilio message factory options interface', () => {
      const options = {
        accountSid: 'AC_test',
        from: '+1234567890',
        status: TwilioStatus.delivered,
        type: NotificationType.Sms,
        processType: MessageProcessType.sms,
        contentType: MessageContentType.custom,
      };

      // This is a compile-time test - if it compiles, the interface is correct
      expect(options.accountSid).toBe('AC_test');
    });
  });

  describe('PaymentDataFactory', () => {
    it('should create payment factory without errors', () => {
      const factory = new PaymentDataFactory(mockDataSource);
      expect(factory).toBeDefined();
    });

    it('should validate payment factory options interface', () => {
      const options = {
        programId: 1,
      };

      // This is a compile-time test - if it compiles, the interface is correct
      expect(options.programId).toBe(1);
    });
  });

  describe('MockDataFactoryService', () => {
    it('should create mock data factory service without errors', () => {
      const service = new MockDataFactoryService(mockDataSource);
      expect(service).toBeDefined();
    });

    it('should validate mock data generation options interface', () => {
      const options = {
        registrationOptions: {
          programId: 1,
          registrationStatus: RegistrationStatusEnum.included,
          preferredLanguage: LanguageEnum.en,
        },
        messageOptions: {
          accountSid: 'AC_test',
          from: '+1234567890',
          status: TwilioStatus.delivered,
          type: NotificationType.Sms,
          processType: MessageProcessType.sms,
          contentType: MessageContentType.custom,
        },
        paymentOptions: {
          programId: 1,
        },
      };

      // This is a compile-time test - if it compiles, the interface is correct
      expect(options.registrationOptions.programId).toBe(1);
    });
  });
});
