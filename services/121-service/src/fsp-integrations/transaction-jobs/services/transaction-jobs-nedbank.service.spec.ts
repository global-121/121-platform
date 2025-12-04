import { TestBed } from '@automock/jest';

import { NedbankVoucherStatus } from '@121-service/src/fsp-integrations/api-integrations/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankError } from '@121-service/src/fsp-integrations/api-integrations/nedbank/errors/nedbank.error';
import { NedbankVoucherScopedRepository } from '@121-service/src/fsp-integrations/api-integrations/nedbank/repositories/nedbank-voucher.scoped.repository';
import { NedbankService } from '@121-service/src/fsp-integrations/api-integrations/nedbank/services/nedbank.service';
import { SaveTransactionProgressAndUpdateRegistrationContext } from '@121-service/src/fsp-integrations/transaction-jobs/interfaces/save-transaction-progress-and-update-registration-context.interface';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { TransactionJobsNedbankService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-nedbank.service';
import { NedbankTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/nedbank-transaction-job.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

const mockedNedbankTransactionJob: NedbankTransactionJobDto = {
  programId: 3,
  transactionId: 3,
  referenceId: 'ref-123',
  transferValue: 25,
  isRetry: false,
  userId: 1,
  bulkSize: 10,
  phoneNumber: '27831234567',
  programFspConfigurationId: 1,
};

const transactionEventContext: TransactionEventCreationContext = {
  userId: mockedNedbankTransactionJob.userId,
  transactionId: mockedNedbankTransactionJob.transactionId,
  programFspConfigurationId:
    mockedNedbankTransactionJob.programFspConfigurationId,
};
const saveTransactionProgressAndUpdateRegistrationContext: SaveTransactionProgressAndUpdateRegistrationContext =
  {
    transactionEventContext,
    referenceId: mockedNedbankTransactionJob.referenceId,
    isRetry: mockedNedbankTransactionJob.isRetry,
  };

describe('TransactionJobsNedbankService', () => {
  let service: TransactionJobsNedbankService;
  let nedbankService: NedbankService;
  let nedbankVoucherScopedRepository: NedbankVoucherScopedRepository;
  let programFspConfigurationRepository: ProgramFspConfigurationRepository;
  let transactionEventsScopedRepository: TransactionEventsScopedRepository;
  let transactionJobsHelperService: TransactionJobsHelperService;
  let transactionsService: TransactionsService;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      TransactionJobsNedbankService,
    ).compile();

    service = unit;
    nedbankService = unitRef.get<NedbankService>(NedbankService);
    nedbankVoucherScopedRepository =
      unitRef.get<NedbankVoucherScopedRepository>(
        NedbankVoucherScopedRepository,
      );
    transactionEventsScopedRepository =
      unitRef.get<TransactionEventsScopedRepository>(
        TransactionEventsScopedRepository,
      );
    programFspConfigurationRepository =
      unitRef.get<ProgramFspConfigurationRepository>(
        ProgramFspConfigurationRepository,
      );
    transactionJobsHelperService = unitRef.get<TransactionJobsHelperService>(
      TransactionJobsHelperService,
    );
    transactionsService = unitRef.get<TransactionsService>(TransactionsService);

    jest
      .spyOn(
        transactionJobsHelperService,
        'createInitiatedOrRetryTransactionEvent',
      )
      .mockImplementation();
    jest
      .spyOn(nedbankVoucherScopedRepository, 'getVoucherWhereStatusNull')
      .mockResolvedValue(null);
    jest
      .spyOn(transactionsService, 'updateTransactionStatus')
      .mockImplementation();
    jest
      .spyOn(nedbankVoucherScopedRepository, 'upsertVoucherByTransactionId')
      .mockResolvedValue(undefined);
    jest
      .spyOn(
        transactionEventsScopedRepository,
        'countFailedTransactionAttempts',
      )
      .mockResolvedValue(0);
    jest
      .spyOn(programFspConfigurationRepository, 'getPropertyValueByName')
      .mockResolvedValue('ref#1');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process Nedbank transaction job successfully', async () => {
    jest
      .spyOn(nedbankService, 'createVoucher')
      .mockResolvedValueOnce(NedbankVoucherStatus.PENDING);

    await service.processNedbankTransactionJob(mockedNedbankTransactionJob);

    expect(
      transactionJobsHelperService.createInitiatedOrRetryTransactionEvent,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        context: transactionEventContext,
        isRetry: mockedNedbankTransactionJob.isRetry,
      }),
    );
    expect(transactionsService.updateTransactionStatus).toHaveBeenCalled();
    expect(
      nedbankVoucherScopedRepository.upsertVoucherByTransactionId,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentReference: expect.any(String),
        orderCreateReference: expect.any(String),
        transactionId: mockedNedbankTransactionJob.transactionId,
        voucherStatus: null,
      }),
    );
    expect(nedbankService.createVoucher).toHaveBeenCalledWith(
      expect.objectContaining({
        transferValue: mockedNedbankTransactionJob.transferValue,
        phoneNumber: mockedNedbankTransactionJob.phoneNumber,
        orderCreateReference: expect.any(String),
        paymentReference: expect.any(String),
      }),
    );
    expect(nedbankVoucherScopedRepository.update).toHaveBeenCalledWith(
      { orderCreateReference: expect.any(String) },
      { status: NedbankVoucherStatus.PENDING },
    );
    expect(
      transactionJobsHelperService.saveTransactionProgressAndUpdateRegistration,
    ).toHaveBeenCalled();
  });

  it('should update transaction and voucher to error/failed if NedbankError is thrown', async () => {
    // Arrange
    const errorMessage = 'Nedbank error occurred';
    const nedbankError = new NedbankError(errorMessage);
    jest
      .spyOn(nedbankService, 'createVoucher')
      .mockRejectedValueOnce(nedbankError);

    // Act
    await service.processNedbankTransactionJob(mockedNedbankTransactionJob);

    // Assert
    expect(
      transactionJobsHelperService.saveTransactionProgressAndUpdateRegistration,
    ).toHaveBeenCalledWith({
      context: saveTransactionProgressAndUpdateRegistrationContext,
      description: TransactionEventDescription.nedbankVoucherCreationRequested,
      errorMessage,
      newTransactionStatus: TransactionStatusEnum.error,
    });
    expect(nedbankVoucherScopedRepository.update).toHaveBeenCalledWith(
      { orderCreateReference: expect.any(String) },
      { status: NedbankVoucherStatus.FAILED },
    );
  });

  it('should never create a payment reference longer than 30 characters', async () => {
    const longPaymentReference = '1234567890123456789012345678901234567890';
    jest
      .spyOn(programFspConfigurationRepository, 'getPropertyValueByName')
      .mockResolvedValue(longPaymentReference);
    jest
      .spyOn(nedbankService, 'createVoucher')
      .mockResolvedValueOnce(NedbankVoucherStatus.PENDING);

    await service.processNedbankTransactionJob(mockedNedbankTransactionJob);

    expect(nedbankService.createVoucher).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentReference: expect.stringMatching(/^.{1,30}$/),
      }),
    );
    expect(nedbankService.createVoucher).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentReference: expect.stringContaining(
          mockedNedbankTransactionJob.phoneNumber,
        ),
      }),
    );
  });

  it('should never create a payment reference with special characters except dash', async () => {
    const specialCharPaymentReference = '1234@5678#9012$3456%7890^';
    jest
      .spyOn(programFspConfigurationRepository, 'getPropertyValueByName')
      .mockResolvedValue(specialCharPaymentReference);
    jest
      .spyOn(nedbankService, 'createVoucher')
      .mockResolvedValueOnce(NedbankVoucherStatus.PENDING);

    await service.processNedbankTransactionJob(mockedNedbankTransactionJob);

    expect(nedbankService.createVoucher).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentReference: expect.stringMatching(/^[a-zA-Z0-9-]*$/),
      }),
    );
  });
});
