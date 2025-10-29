import { TestBed } from '@automock/jest';
import { UpdateResult } from 'typeorm';

import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventsService } from '@121-service/src/payments/transactions/transaction-events/transaction-events.service';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { UILanguageEnum } from '@121-service/src/shared/enum/ui-language.enum';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';

const mockedRegistration: RegistrationEntity = {
  id: 1,
  referenceId: 'ref-123',
  registrationStatus: RegistrationStatusEnum.included,
  paymentCount: 0,
  preferredLanguage: UILanguageEnum.en,
} as RegistrationEntity;

describe('TransactionJobsHelperService', () => {
  let service: TransactionJobsHelperService;
  let registrationScopedRepository: RegistrationScopedRepository;
  let transactionEventsService: TransactionEventsService;
  let messageTemplateService: MessageTemplateService;
  let registrationsBulkService: RegistrationsBulkService;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      TransactionJobsHelperService,
    ).compile();

    service = unit;
    registrationScopedRepository = unitRef.get<RegistrationScopedRepository>(
      RegistrationScopedRepository,
    );
    transactionEventsService = unitRef.get<TransactionEventsService>(
      TransactionEventsService,
    );
    messageTemplateService = unitRef.get<MessageTemplateService>(
      MessageTemplateService,
    );
    registrationsBulkService = unitRef.get<RegistrationsBulkService>(
      RegistrationsBulkService,
    );

    jest
      .spyOn(registrationScopedRepository, 'getByReferenceId')
      .mockResolvedValue(mockedRegistration);
    jest
      .spyOn(registrationScopedRepository, 'updateUnscoped')
      .mockResolvedValue({} as UpdateResult);

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
});
