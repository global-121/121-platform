import { TestBed } from '@automock/jest';
import { UpdateResult } from 'typeorm';

import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

const mockedRegistration: RegistrationEntity = {
  id: 1,
  referenceId: 'ref-123',
  registrationStatus: RegistrationStatusEnum.included,
  paymentCount: 0,
  preferredLanguage: RegistrationPreferredLanguage.en,
} as RegistrationEntity;

describe('TransactionJobsHelperService', () => {
  let service: TransactionJobsHelperService;
  let registrationScopedRepository: RegistrationScopedRepository;
  let transactionsService: TransactionsService;
  let messageTemplateService: MessageTemplateService;
  let registrationsBulkService: RegistrationsBulkService;
  let queueMessageService: MessageQueuesService;
  let registrationsPaginationService: RegistrationsPaginationService;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      TransactionJobsHelperService,
    ).compile();

    service = unit;
    registrationScopedRepository = unitRef.get<RegistrationScopedRepository>(
      RegistrationScopedRepository,
    );
    transactionsService = unitRef.get<TransactionsService>(TransactionsService);
    messageTemplateService = unitRef.get<MessageTemplateService>(
      MessageTemplateService,
    );
    registrationsBulkService = unitRef.get<RegistrationsBulkService>(
      RegistrationsBulkService,
    );
    queueMessageService = unitRef.get<MessageQueuesService>(MessageQueuesService);
    registrationsPaginationService =
      unitRef.get<RegistrationsPaginationService>(RegistrationsPaginationService);

    jest
      .spyOn(registrationScopedRepository, 'getByReferenceId')
      .mockResolvedValue(mockedRegistration);
    jest
      .spyOn(registrationScopedRepository, 'updateUnscoped')
      .mockResolvedValue({} as UpdateResult);

    jest.spyOn(transactionsService, 'saveProgress').mockImplementation();
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

  describe('logTransactionJobStart', () => {
    const context = {
      transactionId: 1,
      userId: 2,
      programFspConfigurationId: 3,
    };

    beforeEach(() => {
      service.setStatusToCompletedIfApplicable = jest.fn();
    });

    it('should create an initiated transaction event and update registration, if not retry', async () => {
      await service.logTransactionJobStart({
        context,
        isRetry: false,
      });

      expect(service.setStatusToCompletedIfApplicable).toHaveBeenCalled();
      expect(transactionsService.saveProgress).toHaveBeenCalledWith({
        context,
        description: TransactionEventDescription.initiated,
        newTransactionStatus: TransactionStatusEnum.waiting,
      });
    });

    it('should create a retry transaction and not update registration, if retry', async () => {
      await service.logTransactionJobStart({
        context,
        isRetry: true,
      });

      expect(service.setStatusToCompletedIfApplicable).not.toHaveBeenCalled();
      expect(transactionsService.saveProgress).toHaveBeenCalledWith({
        context,
        description: TransactionEventDescription.retry,
        newTransactionStatus: TransactionStatusEnum.waiting,
      });
    });
  });

  describe('setStatusToCompletedIfApplicable', () => {
    it('does nothing when program.enableMaxPayments is false', async () => {
      const programIdDisabled = 1;
      const userId = 42;

      jest
        .spyOn(registrationScopedRepository, 'findOneOrFail')
        .mockResolvedValue({
          program: { enableMaxPayments: false, id: programIdDisabled },
        } as any);

      await service.setStatusToCompletedIfApplicable({
        referenceId: mockedRegistration.referenceId,
        userId,
      });

      expect(
        registrationsBulkService.applyRegistrationStatusChangeAndSendMessageByReferenceIds,
      ).not.toHaveBeenCalled();
    });

    it('does nothing when there are no registrations to complete', async () => {
      const programIdNoReg = 2;
      const userId = 7;

      jest
        .spyOn(registrationScopedRepository, 'findOneOrFail')
        .mockResolvedValue({
          program: { enableMaxPayments: true, id: programIdNoReg },
        } as any);
      jest
        .spyOn(registrationScopedRepository, 'shouldChangeStatusToCompleted')
        .mockResolvedValue(false);

      await service.setStatusToCompletedIfApplicable({
        referenceId: mockedRegistration.referenceId,
        userId,
      });

      expect(
        registrationsBulkService.applyRegistrationStatusChangeAndSendMessageByReferenceIds,
      ).not.toHaveBeenCalled();
    });

    it('applies registration status change with template details when template is available', async () => {
      const programIdTemplate = 3;
      const userIdC = 99;
      const ref1 = 'ref-1';

      jest
        .spyOn(registrationScopedRepository, 'findOneOrFail')
        .mockResolvedValue({
          program: { enableMaxPayments: true, id: programIdTemplate },
        } as any);
      jest
        .spyOn(registrationScopedRepository, 'shouldChangeStatusToCompleted')
        .mockResolvedValue(true);
      jest
        .spyOn(messageTemplateService, 'isTemplateAvailable')
        .mockResolvedValue(true as any);

      await service.setStatusToCompletedIfApplicable({
        referenceId: ref1,
        userId: userIdC,
      });

      expect(
        registrationsBulkService.applyRegistrationStatusChangeAndSendMessageByReferenceIds,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          referenceIds: [ref1],
          programId: programIdTemplate,
          registrationStatus: RegistrationStatusEnum.completed,
          userId: userIdC,
          messageContentDetails: {
            messageTemplateKey: RegistrationStatusEnum.completed,
            messageContentType: MessageContentType.completed,
            message: '',
          },
        }),
      );
    });

    it('applies registration status change with empty messageContentDetails when template is not available', async () => {
      const programIdNoTemplate = 4;
      const userIdD = 100;
      const ref2 = 'ref-2';

      jest
        .spyOn(registrationScopedRepository, 'findOneOrFail')
        .mockResolvedValue({
          program: { enableMaxPayments: true, id: programIdNoTemplate },
        } as any);
      jest
        .spyOn(registrationScopedRepository, 'shouldChangeStatusToCompleted')
        .mockResolvedValue(true);
      jest
        .spyOn(messageTemplateService, 'isTemplateAvailable')
        .mockResolvedValue(false as any);

      await service.setStatusToCompletedIfApplicable({
        referenceId: ref2,
        userId: userIdD,
      });

      expect(
        registrationsBulkService.applyRegistrationStatusChangeAndSendMessageByReferenceIds,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          referenceIds: [ref2],
          programId: programIdNoTemplate,
          registrationStatus: RegistrationStatusEnum.completed,
          userId: userIdD,
          messageContentDetails: {},
        }),
      );
    });
  });

  describe('createMessageAndAddToQueue', () => {
    const programId = 1;
    const amountTransferred = 50;
    const userId = 42;
    const templateType = ProgramNotificationEnum.visaLoad;

    it('should queue a message with amountTransferred in placeholderData when no other placeholders are used', async () => {
      jest
        .spyOn(queueMessageService, 'getPlaceholdersInMessageText')
        .mockResolvedValue(['amountTransferred']);
      jest
        .spyOn(queueMessageService, 'addMessageJob')
        .mockResolvedValue(undefined);

      await service.createMessageAndAddToQueue({
        type: templateType,
        programId,
        registration: mockedRegistration,
        amountTransferred,
        bulkSize: 1,
        userId,
      });

      expect(queueMessageService.addMessageJob).toHaveBeenCalledWith(
        expect.objectContaining({
          messageTemplateKey: templateType,
          customData: {
            placeholderData: { amountTransferred: String(amountTransferred) },
          },
        }),
      );
    });

    it('should fetch registration view and include registration attributes when other placeholders are used', async () => {
      jest
        .spyOn(queueMessageService, 'getPlaceholdersInMessageText')
        .mockResolvedValue(['amountTransferred', 'fullName']);
      jest
        .spyOn(registrationsPaginationService, 'getRegistrationViewsByReferenceIds')
        .mockResolvedValue([{ fullName: 'John Doe' } as any]);
      jest
        .spyOn(queueMessageService, 'addMessageJob')
        .mockResolvedValue(undefined);

      await service.createMessageAndAddToQueue({
        type: templateType,
        programId,
        registration: mockedRegistration,
        amountTransferred,
        bulkSize: 1,
        userId,
      });

      expect(
        registrationsPaginationService.getRegistrationViewsByReferenceIds,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          programId,
          referenceIds: [mockedRegistration.referenceId],
          select: ['fullName'],
        }),
      );

      expect(queueMessageService.addMessageJob).toHaveBeenCalledWith(
        expect.objectContaining({
          messageTemplateKey: templateType,
          customData: {
            placeholderData: {
              amountTransferred: String(amountTransferred),
              fullName: 'John Doe',
            },
          },
        }),
      );
    });

    it('should still queue a message with amountTransferred when the template does not exist', async () => {
      jest
        .spyOn(queueMessageService, 'getPlaceholdersInMessageText')
        .mockRejectedValue(
          new Error('Message template with key visaLoad not found or has no message'),
        );
      jest
        .spyOn(queueMessageService, 'addMessageJob')
        .mockResolvedValue(undefined);

      await service.createMessageAndAddToQueue({
        type: templateType,
        programId,
        registration: mockedRegistration,
        amountTransferred,
        bulkSize: 1,
        userId,
      });

      expect(queueMessageService.addMessageJob).toHaveBeenCalledWith(
        expect.objectContaining({
          messageTemplateKey: templateType,
          customData: {
            placeholderData: { amountTransferred: String(amountTransferred) },
          },
        }),
      );
    });
  });
});
