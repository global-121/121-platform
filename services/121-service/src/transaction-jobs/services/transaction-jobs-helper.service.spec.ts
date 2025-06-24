import { TestBed } from '@automock/jest';
import { UpdateResult } from 'typeorm';

import { EventsService } from '@121-service/src/events/events.service';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LatestTransactionRepository } from '@121-service/src/payments/transactions/repositories/latest-transaction.repository';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';

const mockedRegistration: RegistrationEntity = {
  id: 1,
  referenceId: 'ref-123',
  registrationStatus: RegistrationStatusEnum.included,
  paymentCount: 0,
  preferredLanguage: LanguageEnum.en,
} as RegistrationEntity;

const mockedOldRegistration: RegistrationEntity = {
  ...mockedRegistration,
  registrationStatus: RegistrationStatusEnum.included,
};

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
  let eventsService: EventsService;
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
    programRepository = unitRef.get<ProgramRepository>(ProgramRepository);
    eventsService = unitRef.get<EventsService>(EventsService);
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
      .spyOn(eventsService, 'createFromRegistrationViews')
      .mockResolvedValue();
    jest.spyOn(queueMessageService, 'addMessageJob').mockResolvedValue();
    jest
      .spyOn(messageTemplateService, 'getMessageTemplatesByProgramId')
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
    it('should create transaction, update registration, and create event if status changed', async () => {
      const registration = {
        ...mockedRegistration,
        registrationStatus: RegistrationStatusEnum.completed,
      };
      const oldRegistration = {
        ...mockedOldRegistration,
        registrationStatus: RegistrationStatusEnum.included,
      };

      await service.createTransactionAndUpdateRegistration({
        programId: 1,
        paymentNumber: 1,
        userId: 1,
        transferAmountInMajorUnit: 100,
        programFspConfigurationId: 1,
        registration,
        oldRegistration,
        isRetry: false,
        status: TransactionStatusEnum.success,
      });

      expect(transactionScopedRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100,
          registration,
          programId: 1,
          payment: 1,
          userId: 1,
          status: TransactionStatusEnum.success,
        }),
      );
      expect(
        latestTransactionRepository.insertOrUpdateFromTransaction,
      ).toHaveBeenCalled();
      expect(registrationScopedRepository.updateUnscoped).toHaveBeenCalled();
      expect(eventsService.createFromRegistrationViews).toHaveBeenCalled();
    });

    it('should not create event if status did not change', async () => {
      const registration = {
        ...mockedRegistration,
        registrationStatus: RegistrationStatusEnum.included,
      };
      const oldRegistration = {
        ...mockedOldRegistration,
        registrationStatus: RegistrationStatusEnum.included,
      };

      await service.createTransactionAndUpdateRegistration({
        programId: 1,
        paymentNumber: 1,
        userId: 1,
        transferAmountInMajorUnit: 100,
        programFspConfigurationId: 1,
        registration,
        oldRegistration,
        isRetry: false,
        status: TransactionStatusEnum.success,
      });

      expect(eventsService.createFromRegistrationViews).not.toHaveBeenCalled();
    });

    it('should not update registration or create event if isRetry is true', async () => {
      await service.createTransactionAndUpdateRegistration({
        programId: 1,
        paymentNumber: 1,
        userId: 1,
        transferAmountInMajorUnit: 100,
        programFspConfigurationId: 1,
        registration: mockedRegistration,
        oldRegistration: mockedOldRegistration,
        isRetry: true,
        status: TransactionStatusEnum.success,
      });

      expect(
        registrationScopedRepository.updateUnscoped,
      ).not.toHaveBeenCalled();
      expect(eventsService.createFromRegistrationViews).not.toHaveBeenCalled();
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
