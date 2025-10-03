import { TestBed } from '@automock/jest';
import { UpdateResult } from 'typeorm';

import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageContentDetails } from '@121-service/src/notifications/interfaces/message-content-details.interface';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LatestTransactionRepository } from '@121-service/src/payments/transactions/repositories/latest-transaction.repository';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { SharedTransactionJobDto } from '@121-service/src/transaction-queues/dto/shared-transaction-job.dto';

const mockedRegistration: RegistrationEntity = {
  id: 1,
  referenceId: 'ref-123',
  registrationStatus: RegistrationStatusEnum.included,
  paymentCount: 0,
  preferredLanguage: LanguageEnum.en,
} as RegistrationEntity;

const mockedTransactionId = 1;

const mockedProgram = {
  enableMaxPayments: true,
  titlePortal: { en: 'Example Title' },
  published: false,
  distributionDuration: 100,
  fixedTransferValue: 500,
  budget: 50000,
};

describe('TransactionJobsHelperService', () => {
  let service: TransactionJobsHelperService;
  let registrationScopedRepository: RegistrationScopedRepository;
  let transactionScopedRepository: TransactionScopedRepository;
  let latestTransactionRepository: LatestTransactionRepository;
  let programRepository: ProgramRepository;
  let messageTemplateService: MessageTemplateService;
  let queueMessageService: MessageQueuesService;
  let registrationsBulkService: RegistrationsBulkService;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      TransactionJobsHelperService,
    ).compile();

    service = unit;
    registrationScopedRepository = unitRef.get<RegistrationScopedRepository>(
      RegistrationScopedRepository,
    );
    transactionScopedRepository = unitRef.get<TransactionScopedRepository>(
      TransactionScopedRepository,
    );
    latestTransactionRepository = unitRef.get<LatestTransactionRepository>(
      LatestTransactionRepository,
    );
    programRepository = unitRef.get<ProgramRepository>(ProgramRepository);
    registrationsBulkService = unitRef.get<RegistrationsBulkService>(
      RegistrationsBulkService,
    );
    messageTemplateService = unitRef.get<MessageTemplateService>(
      MessageTemplateService,
    );
    queueMessageService =
      unitRef.get<MessageQueuesService>(MessageQueuesService);

    jest
      .spyOn(registrationScopedRepository, 'getByReferenceId')
      .mockResolvedValue(mockedRegistration);
    jest
      .spyOn(registrationScopedRepository, 'updateUnscoped')
      .mockResolvedValue({} as UpdateResult);
    jest
      .spyOn(programRepository, 'findByIdOrFail')
      .mockResolvedValue(mockedProgram as any);
    jest.spyOn(transactionScopedRepository, 'save').mockResolvedValue({
      id: mockedTransactionId,
    } as any);
    jest
      .spyOn(latestTransactionRepository, 'insertOrUpdateFromTransaction')
      .mockResolvedValue();
    jest
      .spyOn(latestTransactionRepository, 'getPaymentCount')
      .mockResolvedValue(1);
    jest
      .spyOn(
        registrationsBulkService,
        'applyRegistrationStatusChangeAndSendMessageByReferenceIds',
      )
      .mockResolvedValue();
    jest.spyOn(queueMessageService, 'addMessageJob').mockResolvedValue();
    jest
      .spyOn(messageTemplateService, 'getMessageTemplatesByProgramId')
      .mockResolvedValue([
        { language: LanguageEnum.en, message: 'Payment of [[1]] received.' },
        { language: LanguageEnum.fr, message: 'Paiement de [[1]] reçu.' },
      ] as MessageTemplateEntity[]);
    jest
      .spyOn(messageTemplateService, 'isTemplateAvailable')
      .mockResolvedValue(true);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRegistrationOrThrow', () => {
    it('should return registration if found', async () => {
      const result = await service.getRegistrationOrThrow('ref-123');
      expect(result).toBe(mockedRegistration);
      expect(
        registrationScopedRepository.getByReferenceId,
      ).toHaveBeenCalledWith({ referenceId: 'ref-123' });
    });

    it('should throw if registration not found', async () => {
      jest
        .spyOn(registrationScopedRepository, 'getByReferenceId')
        .mockResolvedValueOnce(null);
      await expect(service.getRegistrationOrThrow('not-found')).rejects.toThrow(
        'Registration was not found for referenceId not-found',
      );
    });
  });

  describe('createTransactionAndUpdateRegistration', () => {
    const transactionJob: SharedTransactionJobDto = {
      programId: 1,
      paymentId: 5,
      userId: 1,
      programFspConfigurationId: 1,
      isRetry: false,
      referenceId: 'ref-123',
      bulkSize: 10,
      transactionAmount: 100,
    };

    it('should update the payment count', async () => {
      // Arrange
      const registration = structuredClone(mockedRegistration);
      const paymentCountFromDb = 5;

      jest
        .spyOn(latestTransactionRepository, 'getPaymentCount')
        .mockResolvedValue(paymentCountFromDb);

      // Act
      await service.createTransactionAndUpdateRegistration({
        registration,
        transactionJob,
        transferAmountInMajorUnit: 100,
        status: TransactionStatusEnum.success,
      });

      // Assert
      expect(registrationScopedRepository.updateUnscoped).toHaveBeenCalledTimes(
        1,
      );
      expect(registrationScopedRepository.updateUnscoped).toHaveBeenCalledWith(
        1,
        {
          paymentCount: paymentCountFromDb,
        },
      );
    });

    it('should not trigger status change if max payments not exceeded', async () => {
      // Arrange
      const registration = structuredClone(mockedRegistration);
      const paymentCountFromDb = 3;

      jest
        .spyOn(latestTransactionRepository, 'getPaymentCount')
        .mockResolvedValue(paymentCountFromDb);

      // Act
      await service.createTransactionAndUpdateRegistration({
        registration,
        transactionJob,
        transferAmountInMajorUnit: 100,
        status: TransactionStatusEnum.success,
      });

      // Assert
      expect(
        registrationsBulkService.applyRegistrationStatusChangeAndSendMessageByReferenceIds,
      ).not.toHaveBeenCalled();
    });

    it("should not update the payment count if it's a retry", async () => {
      // Arrange
      const registration = {
        ...mockedRegistration,
        registrationStatus: RegistrationStatusEnum.completed,
      };

      const paymentCountFromDb = 5;

      jest
        .spyOn(latestTransactionRepository, 'getPaymentCount')
        .mockResolvedValue(paymentCountFromDb);

      // Act
      await service.createTransactionAndUpdateRegistration({
        registration,
        transactionJob: {
          ...transactionJob,
          isRetry: true,
        },
        transferAmountInMajorUnit: 100,
        status: TransactionStatusEnum.success,
      });

      // Assert
      expect(
        registrationScopedRepository.updateUnscoped,
      ).not.toHaveBeenCalled();
    });

    it('should trigger status change to completed when max payments exceeded and template available', async () => {
      // Arrange
      const maxPayments = 6;
      const paymentCountAfterTransaction = 6;

      const registration = {
        ...mockedRegistration,
        maxPayments,
      };

      jest
        .spyOn(latestTransactionRepository, 'getPaymentCount')
        .mockResolvedValue(paymentCountAfterTransaction);
      jest
        .spyOn(messageTemplateService, 'isTemplateAvailable')
        .mockResolvedValue(true);

      // Act
      await service.createTransactionAndUpdateRegistration({
        registration,
        transactionJob,
        transferAmountInMajorUnit: 100,
        status: TransactionStatusEnum.success,
      });

      // Assert
      const expectedMessageContentDetails: MessageContentDetails = {
        messageTemplateKey: RegistrationStatusEnum.completed,
        messageContentType: MessageContentType.completed,
        message: '',
      };

      expect(
        registrationsBulkService.applyRegistrationStatusChangeAndSendMessageByReferenceIds,
      ).toHaveBeenCalledWith({
        referenceIds: [registration.referenceId],
        programId: transactionJob.programId,
        registrationStatus: RegistrationStatusEnum.completed,
        userId: transactionJob.userId,
        messageContentDetails: expectedMessageContentDetails,
      });
    });

    it('should trigger status change to completed when max payments exceeded and template not available', async () => {
      // Arrange
      const maxPayments = 6;
      const paymentCountAfterTransaction = 6;

      const registration = {
        ...mockedRegistration,
        maxPayments,
      };

      jest
        .spyOn(latestTransactionRepository, 'getPaymentCount')
        .mockResolvedValue(paymentCountAfterTransaction);
      jest
        .spyOn(messageTemplateService, 'isTemplateAvailable')
        .mockResolvedValue(false);

      // Act
      await service.createTransactionAndUpdateRegistration({
        registration,
        transactionJob,
        transferAmountInMajorUnit: 100,
        status: TransactionStatusEnum.success,
      });

      // Assert
      expect(
        registrationsBulkService.applyRegistrationStatusChangeAndSendMessageByReferenceIds,
      ).toHaveBeenCalledWith({
        referenceIds: [registration.referenceId],
        programId: transactionJob.programId,
        registrationStatus: RegistrationStatusEnum.completed,
        userId: transactionJob.userId,
        messageContentDetails: {},
      });
    });

    it('should not update registration or trigger status change if isRetry is true', async () => {
      await service.createTransactionAndUpdateRegistration({
        registration: mockedRegistration,
        transactionJob: {
          ...transactionJob,
          isRetry: true,
        },
        transferAmountInMajorUnit: 100,
        status: TransactionStatusEnum.success,
      });

      expect(
        registrationScopedRepository.updateUnscoped,
      ).not.toHaveBeenCalled();
      expect(
        registrationsBulkService.applyRegistrationStatusChangeAndSendMessageByReferenceIds,
      ).not.toHaveBeenCalled();
    });
  });

  describe('createMessageAndAddToQueue', () => {
    it('should create and queue a message with dynamic content', async () => {
      await service.createMessageAndAddToQueue({
        type: ProgramNotificationEnum.visaLoad,
        programId: 1,
        registration: mockedRegistration,
        amountTransferred: 123,
        bulkSize: 10,
        userId: 1,
      });

      expect(
        messageTemplateService.getMessageTemplatesByProgramId,
      ).toHaveBeenCalledWith(1, ProgramNotificationEnum.visaLoad);
      expect(queueMessageService.addMessageJob).toHaveBeenCalledWith(
        expect.objectContaining({
          registration: mockedRegistration,
          message: 'Payment of 123 received.',
          bulksize: 10,
          userId: 1,
          messageContentType: MessageContentType.payment,
          messageProcessType: expect.anything(),
        }),
      );
    });

    it('should fallback to English template if preferred language not found', async () => {
      const registration = {
        ...mockedRegistration,
        preferredLanguage: LanguageEnum.nl,
      };
      await service.createMessageAndAddToQueue({
        type: ProgramNotificationEnum.visaLoad,
        programId: 1,
        registration,
        amountTransferred: 456,
        bulkSize: 5,
        userId: 2,
      });

      expect(queueMessageService.addMessageJob).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Payment of 456 received.',
        }),
      );
    });

    it('should handle missing template gracefully', async () => {
      jest
        .spyOn(messageTemplateService, 'getMessageTemplatesByProgramId')
        .mockResolvedValue([]);
      await service.createMessageAndAddToQueue({
        type: ProgramNotificationEnum.visaLoad,
        programId: 1,
        registration: mockedRegistration,
        amountTransferred: 789,
        bulkSize: 1,
        userId: 3,
      });

      expect(queueMessageService.addMessageJob).toHaveBeenCalledWith(
        expect.objectContaining({
          message: undefined,
        }),
      );
    });
  });
});
