import { TestBed } from '@automock/jest';
import { UpdateResult } from 'typeorm';

import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventsService } from '@121-service/src/payments/transactions/transaction-events/transaction-events.service';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
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

describe('TransactionJobsHelperService', () => {
  let service: TransactionJobsHelperService;
  let registrationScopedRepository: RegistrationScopedRepository;
  let transactionEventsService: TransactionEventsService;

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
});
