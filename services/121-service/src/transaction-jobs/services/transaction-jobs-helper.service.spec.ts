import { TestBed } from '@automock/jest';
import { UpdateResult } from 'typeorm';

import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventsService } from '@121-service/src/payments/transactions/transaction-events/transaction-events.service';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';

const mockedRegistration: RegistrationEntity = {
  id: 1,
  referenceId: 'ref-123',
  registrationStatus: RegistrationStatusEnum.included,
  paymentCount: 0,
  preferredLanguage: LanguageEnum.en,
} as RegistrationEntity;

describe('TransactionJobsHelperService', () => {
  let service: TransactionJobsHelperService;
  let registrationScopedRepository: RegistrationScopedRepository;
  let messageTemplateService: MessageTemplateService;
  let queueMessageService: MessageQueuesService;
  let registrationsBulkService: RegistrationsBulkService;
  let transactionEventsService: TransactionEventsService;

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
    programRepository = unitRef.get<ProgramRepository>(ProgramRepository);
    registrationsBulkService = unitRef.get<RegistrationsBulkService>(
      RegistrationsBulkService,
    );
    messageTemplateService = unitRef.get<MessageTemplateService>(
      MessageTemplateService,
    );
    queueMessageService =
      unitRef.get<MessageQueuesService>(MessageQueuesService);
    transactionEventsService = unitRef.get<TransactionEventsService>(
      TransactionEventsService,
    );

    jest
      .spyOn(registrationScopedRepository, 'getByReferenceId')
      .mockResolvedValue(mockedRegistration);
    jest
      .spyOn(registrationScopedRepository, 'updateUnscoped')
      .mockResolvedValue({} as UpdateResult);
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
    jest.spyOn(transactionEventsService, 'createEvent').mockImplementation();
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

  describe('createInitiatedOrRetryTransactionEvent', () => {
    const context = {
      transactionId: 1,
      userId: 2,
      programFspConfigurationId: 3,
    };

    it('should create an initiated transaction event when isRetry is false', async () => {
      await service.createInitiatedOrRetryTransactionEvent({
        context,
        isRetry: false,
      });

      expect(transactionEventsService.createEvent).toHaveBeenCalledWith({
        context,
        type: TransactionEventType.initiated,
        description: TransactionEventDescription.initiated,
      });
    });

    it('should create a retry transaction event when isRetry is true', async () => {
      await service.createInitiatedOrRetryTransactionEvent({
        context,
        isRetry: true,
      });

      expect(transactionEventsService.createEvent).toHaveBeenCalledWith({
        context,
        type: TransactionEventType.retry,
        description: TransactionEventDescription.retry,
      });
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
