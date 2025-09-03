import { TestBed } from '@automock/jest';
import { UpdateResult } from 'typeorm';

import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProjectNotificationEnum } from '@121-service/src/notifications/enum/project-notification.enum';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LatestTransactionRepository } from '@121-service/src/payments/transactions/repositories/latest-transaction.repository';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { ProjectRepository } from '@121-service/src/projects/repositories/project.repository';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationEventsService } from '@121-service/src/registration-events/registration-events.service';
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

const mockedProject = {
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
  let projectRepository: ProjectRepository;
  let registrationEventsService: RegistrationEventsService;
  let messageTemplateService: MessageTemplateService;
  let queueMessageService: MessageQueuesService;

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
    projectRepository = unitRef.get<ProjectRepository>(ProjectRepository);
    registrationEventsService = unitRef.get<RegistrationEventsService>(
      RegistrationEventsService,
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
      .spyOn(projectRepository, 'findByIdOrFail')
      .mockResolvedValue(mockedProject as any);
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
      .spyOn(registrationEventsService, 'createFromRegistrationViews')
      .mockResolvedValue();
    jest.spyOn(queueMessageService, 'addMessageJob').mockResolvedValue();
    jest
      .spyOn(messageTemplateService, 'getMessageTemplatesByProjectId')
      .mockResolvedValue([
        { language: LanguageEnum.en, message: 'Payment of [[1]] received.' },
        { language: LanguageEnum.fr, message: 'Paiement de [[1]] reçu.' },
      ] as MessageTemplateEntity[]);
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
      projectId: 1,
      paymentId: 5,
      userId: 1,
      projectFspConfigurationId: 1,
      isRetry: false,
      referenceId: 'ref-123',
      phoneNumber: '1234567890',
      bulkSize: 10,
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

    it('should not update the registration status to complete if the project does not have maxPayments', async () => {
      // Arrange
      const mockedProjectNoMaxPayments = {
        enableMaxPayments: false,
        titlePortal: { en: 'Example Title' },
        published: false,
        distributionDuration: 100,
        fixedTransferValue: 500,
        budget: 50000,
      };
      jest
        .spyOn(projectRepository, 'findByIdOrFail')
        .mockResolvedValue(mockedProjectNoMaxPayments as any);

      const registration = structuredClone(mockedRegistration);

      // Act
      await service.createTransactionAndUpdateRegistration({
        registration,
        transactionJob,
        transferAmountInMajorUnit: 100,
        status: TransactionStatusEnum.success,
      });

      // Assert
      // The first call is for updating the payment count, the 2nd call would have been for
      // updating the registration status, which we expect to *not* happen.
      expect(registrationScopedRepository.updateUnscoped).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should not update the registration status to "completed" if the registration has less payments than maxPayments', async () => {
      // Arrange
      const mockedProjectNoMaxPayments = {
        enableMaxPayments: true,
        titlePortal: { en: 'Example Title' },
        published: false,
        distributionDuration: 100,
        fixedTransferValue: 500,
        budget: 50000,
      };
      const localMockedRegistration = {
        ...mockedRegistration,
        paymentCount: 4,
      };
      jest
        .spyOn(projectRepository, 'findByIdOrFail')
        .mockResolvedValue(mockedProjectNoMaxPayments as any);

      const paymentCountFromDb = 5;
      jest
        .spyOn(latestTransactionRepository, 'getPaymentCount')
        .mockResolvedValue(paymentCountFromDb);

      // Act
      await service.createTransactionAndUpdateRegistration({
        registration: localMockedRegistration,
        transactionJob,
        transferAmountInMajorUnit: 100,
        status: TransactionStatusEnum.success,
      });

      // Assert
      // The first call is for updating the payment count, the 2nd call would have been for
      // updating the registration status, which we expect to *not* happen.
      expect(registrationScopedRepository.updateUnscoped).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should not update the registration status to "completed" if the registration does not have maxPayments but the project does', async () => {
      // Arrange
      const mockedProjectNoMaxPayments = {
        enableMaxPayments: true,
        titlePortal: { en: 'Example Title' },
        published: false,
        distributionDuration: 100,
        fixedTransferValue: 500,
        budget: 50000,
      };
      const localMockedRegistration = {
        ...mockedRegistration,
        maxPayments: undefined,
      };
      jest
        .spyOn(projectRepository, 'findByIdOrFail')
        .mockResolvedValue(mockedProjectNoMaxPayments as any);

      const paymentCountFromDb = 5;
      jest
        .spyOn(latestTransactionRepository, 'getPaymentCount')
        .mockResolvedValue(paymentCountFromDb);

      // Act
      await service.createTransactionAndUpdateRegistration({
        registration: localMockedRegistration,
        transactionJob,
        transferAmountInMajorUnit: 100,
        status: TransactionStatusEnum.success,
      });

      // Assert
      // The first call is for updating the payment count, the 2nd call would have been for
      // updating the registration status, which we expect to *not* happen.
      expect(registrationScopedRepository.updateUnscoped).toHaveBeenCalledTimes(
        1,
      );
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

    it('create a registration status change event if status moved to "completed"', async () => {
      // Arrange
      const maxPayments = 6;
      const alreadyCompletedPaymentsBeforeTransaction = 5;

      const mockedProjectNoMaxPayments = {
        enableMaxPayments: true,
        titlePortal: { en: 'Example Title' },
        published: false,
        distributionDuration: 100,
        fixedTransferValue: 500,
        budget: 50000,
      };
      const localMockedRegistration = {
        ...mockedRegistration,
        paymentCount: alreadyCompletedPaymentsBeforeTransaction,
        maxPayments,
      };
      jest
        .spyOn(projectRepository, 'findByIdOrFail')
        .mockResolvedValue(mockedProjectNoMaxPayments as any);

      jest
        .spyOn(latestTransactionRepository, 'getPaymentCount')
        .mockResolvedValue(alreadyCompletedPaymentsBeforeTransaction + 1);

      // Act
      await service.createTransactionAndUpdateRegistration({
        registration: localMockedRegistration,
        transactionJob,
        transferAmountInMajorUnit: 100,
        status: TransactionStatusEnum.success,
      });

      // Assert
      expect(
        registrationEventsService.createFromRegistrationViews,
      ).toHaveBeenCalledWith(
        { id: 1, status: 'included' },
        { id: 1, status: 'completed' },
        { explicitRegistrationPropertyNames: ['status'] },
      );
    });

    it('does not create a registration status change event if status did not move', async () => {
      // Arrange
      const maxPayments = 6;
      const alreadyCompletedPaymentsBeforeTransaction = 4;

      const mockedProjectNoMaxPayments = {
        enableMaxPayments: true,
        titlePortal: { en: 'Example Title' },
        published: false,
        distributionDuration: 100,
        fixedTransferValue: 500,
        budget: 50000,
      };
      const localMockedRegistration = {
        ...mockedRegistration,
        paymentCount: alreadyCompletedPaymentsBeforeTransaction,
        maxPayments,
      };
      jest
        .spyOn(projectRepository, 'findByIdOrFail')
        .mockResolvedValue(mockedProjectNoMaxPayments as any);

      jest
        .spyOn(latestTransactionRepository, 'getPaymentCount')
        .mockResolvedValue(alreadyCompletedPaymentsBeforeTransaction + 1);

      // Act
      await service.createTransactionAndUpdateRegistration({
        registration: localMockedRegistration,
        transactionJob,
        transferAmountInMajorUnit: 100,
        status: TransactionStatusEnum.success,
      });

      // Assert
      expect(
        registrationEventsService.createFromRegistrationViews,
      ).not.toHaveBeenCalled();
    });

    it('should not update registration or create event if isRetry is true', async () => {
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
        registrationEventsService.createFromRegistrationViews,
      ).not.toHaveBeenCalled();
    });
  });

  describe('createMessageAndAddToQueue', () => {
    it('should create and queue a message with dynamic content', async () => {
      await service.createMessageAndAddToQueue({
        type: ProjectNotificationEnum.visaLoad,
        projectId: 1,
        registration: mockedRegistration,
        amountTransferred: 123,
        bulkSize: 10,
        userId: 1,
      });

      expect(
        messageTemplateService.getMessageTemplatesByProjectId,
      ).toHaveBeenCalledWith(1, ProjectNotificationEnum.visaLoad);
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
        type: ProjectNotificationEnum.visaLoad,
        projectId: 1,
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
        .spyOn(messageTemplateService, 'getMessageTemplatesByProjectId')
        .mockResolvedValue([]);
      await service.createMessageAndAddToQueue({
        type: ProjectNotificationEnum.visaLoad,
        projectId: 1,
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
