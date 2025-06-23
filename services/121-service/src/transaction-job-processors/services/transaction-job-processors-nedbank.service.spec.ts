import { TestBed } from '@automock/jest';
import { UpdateResult } from 'typeorm';

import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankService } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.service';
import { NedbankVoucherScopedRepository } from '@121-service/src/payments/fsp-integration/nedbank/repositories/nedbank-voucher.scoped.repository';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { TransactionJobProcessorsHelperService } from '@121-service/src/transaction-job-processors/services/transaction-job-processors-helper.service';
import { TransactionJobProcessorsNedbankService } from '@121-service/src/transaction-job-processors/services/transaction-job-processors-nedbank.service';
import { NedbankTransactionJobDto } from '@121-service/src/transaction-queues/dto/nedbank-transaction-job.dto';

const mockedRegistration = {
  id: 1,
  referenceId: 'ref-123',
  registrationStatus: 'active',
  paymentCount: 0,
  preferredLanguage: 'en',
} as any;

const mockedTransactionId = 1;

const mockedNedbankTransactionJob: NedbankTransactionJobDto = {
  programId: 3,
  paymentNumber: 3,
  referenceId: 'ref-123',
  transactionAmount: 25,
  isRetry: false,
  userId: 1,
  bulkSize: 10,
  phoneNumber: '27831234567',
  programFspConfigurationId: 1,
};

describe('TransactionJobProcessorsNedbankService', () => {
  let service: TransactionJobProcessorsNedbankService;
  let nedbankService: NedbankService;
  let nedbankVoucherScopedRepository: NedbankVoucherScopedRepository;
  let transactionScopedRepository: TransactionScopedRepository;
  let programFspConfigurationRepository: ProgramFspConfigurationRepository;
  let transactionJobProcessorsHelperService: TransactionJobProcessorsHelperService;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      TransactionJobProcessorsNedbankService,
    ).compile();

    service = unit;
    nedbankService = unitRef.get<NedbankService>(NedbankService);
    nedbankVoucherScopedRepository =
      unitRef.get<NedbankVoucherScopedRepository>(
        NedbankVoucherScopedRepository,
      );
    transactionScopedRepository = unitRef.get<TransactionScopedRepository>(
      TransactionScopedRepository,
    );
    programFspConfigurationRepository =
      unitRef.get<ProgramFspConfigurationRepository>(
        ProgramFspConfigurationRepository,
      );
    transactionJobProcessorsHelperService =
      unitRef.get<TransactionJobProcessorsHelperService>(
        TransactionJobProcessorsHelperService,
      );

    jest
      .spyOn(transactionJobProcessorsHelperService, 'getRegistrationOrThrow')
      .mockResolvedValue(mockedRegistration);
    jest
      .spyOn(
        transactionJobProcessorsHelperService,
        'createTransactionAndUpdateRegistration',
      )
      .mockResolvedValue({ id: mockedTransactionId } as any);
    jest
      .spyOn(nedbankVoucherScopedRepository, 'getVoucherWhereStatusNull')
      .mockResolvedValue(null);
    jest
      .spyOn(nedbankVoucherScopedRepository, 'storeVoucher')
      .mockResolvedValue(undefined);
    jest
      .spyOn(nedbankVoucherScopedRepository, 'update')
      .mockResolvedValue(new UpdateResult());
    jest.spyOn(transactionScopedRepository, 'count').mockResolvedValue(0);
    jest
      .spyOn(transactionScopedRepository, 'update')
      .mockResolvedValue({} as UpdateResult);
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
      transactionJobProcessorsHelperService.getRegistrationOrThrow,
    ).toHaveBeenCalledWith(mockedNedbankTransactionJob.referenceId);
    expect(
      transactionJobProcessorsHelperService.createTransactionAndUpdateRegistration,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        programId: mockedNedbankTransactionJob.programId,
        paymentNumber: mockedNedbankTransactionJob.paymentNumber,
        userId: mockedNedbankTransactionJob.userId,
        transferAmountInMajorUnit:
          mockedNedbankTransactionJob.transactionAmount,
        programFspConfigurationId:
          mockedNedbankTransactionJob.programFspConfigurationId,
        registration: mockedRegistration,
        oldRegistration: expect.any(Object),
        isRetry: mockedNedbankTransactionJob.isRetry,
        status: TransactionStatusEnum.waiting,
      }),
    );
    expect(nedbankVoucherScopedRepository.storeVoucher).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentReference: expect.any(String),
        orderCreateReference: expect.any(String),
        transactionId: mockedTransactionId,
      }),
    );
    expect(nedbankService.createVoucher).toHaveBeenCalledWith(
      expect.objectContaining({
        transferAmount: mockedNedbankTransactionJob.transactionAmount,
        phoneNumber: mockedNedbankTransactionJob.phoneNumber,
        orderCreateReference: expect.any(String),
        paymentReference: expect.any(String),
      }),
    );
    expect(nedbankVoucherScopedRepository.update).toHaveBeenCalledWith(
      { orderCreateReference: expect.any(String) },
      { status: NedbankVoucherStatus.PENDING },
    );
  });

  it('should update transaction and voucher to error/failed if NedbankError is thrown', async () => {
    const errorMessage = 'Nedbank error occurred';
    const nedbankError = new NedbankError(errorMessage);
    jest
      .spyOn(nedbankService, 'createVoucher')
      .mockRejectedValueOnce(nedbankError);

    await service.processNedbankTransactionJob(mockedNedbankTransactionJob);

    expect(transactionScopedRepository.update).toHaveBeenCalledWith(
      { id: mockedTransactionId },
      {
        status: TransactionStatusEnum.error,
        errorMessage: expect.stringContaining(errorMessage),
      },
    );
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
