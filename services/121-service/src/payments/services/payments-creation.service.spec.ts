import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventsService } from '@121-service/src/payments/payment-events/payment-events.service';
import { PaymentsCreationService } from '@121-service/src/payments/services/payments-creation.service';
import { PaymentsHelperService } from '@121-service/src/payments/services/payments-helper.service';
import { ProgramPaymentsLocksService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';

describe('PaymentsCreationService', () => {
  let service: PaymentsCreationService;
  let programPaymentsLocksService: ProgramPaymentsLocksService;
  let paymentsHelperService: PaymentsHelperService;
  let paymentEventsService: PaymentEventsService;
  let transactionsService: TransactionsService;
  let registrationsBulkService: RegistrationsBulkService;
  let registrationsPaginationService: RegistrationsPaginationService;

  const basePaymentParams = {
    userId: 1,
    programId: 2,
    transferValue: 100,
    query: { path: 'test' },
    dryRun: false,
    note: 'test',
  };

  beforeEach(() => {
    programPaymentsLocksService = {
      checkPaymentInProgressAndThrow: jest.fn(),
      checkAndLockPaymentProgressOrThrow: jest.fn(),
      unlockPaymentsForProgram: jest.fn(),
    } as unknown as ProgramPaymentsLocksService;

    paymentsHelperService = {
      checkFspConfigurationsOrThrow: jest.fn(),
    } as unknown as PaymentsHelperService;
    paymentEventsService = {
      createEvent: jest.fn(),
      createNoteEvent: jest.fn(),
    } as unknown as PaymentEventsService;
    transactionsService = {
      createTransactionsAndEvents: jest.fn(),
    } as unknown as TransactionsService;
    registrationsBulkService = {
      setQueryPropertiesBulkAction: jest.fn().mockReturnValue({}),
      getBulkActionResult: jest.fn().mockResolvedValue({}),
      getBaseQuery: jest
        .fn()
        .mockReturnValue({ andWhere: jest.fn().mockReturnThis() }),
    } as unknown as RegistrationsBulkService;
    registrationsPaginationService = {
      getRegistrationViewsChunkedByPaginateQuery: jest.fn().mockResolvedValue([
        {
          paymentAmountMultiplier: 1,
          programFspConfigurationName: 'fspA',
          referenceId: 'ref1',
        },
      ]),
      getRegistrationViewsChunkedByReferenceIds: jest
        .fn()
        .mockResolvedValue([
          { id: 1, paymentAmountMultiplier: 1, programFspConfigurationId: 2 },
        ]),
    } as unknown as RegistrationsPaginationService;

    service = new PaymentsCreationService(
      registrationsBulkService,
      registrationsPaginationService,
      paymentsHelperService,
      paymentEventsService,
      programPaymentsLocksService,
      transactionsService,
    );
    (service as any).paymentRepository = {
      save: jest.fn().mockResolvedValue({ id: 123 }),
    };
  });

  it('should handle dryRun scenario and not call write function', async () => {
    const params = { ...basePaymentParams, dryRun: true };
    const result = await service.createPayment(params);

    expect(
      programPaymentsLocksService.checkAndLockPaymentProgressOrThrow,
    ).not.toHaveBeenCalled();
    expect(
      programPaymentsLocksService.unlockPaymentsForProgram,
    ).not.toHaveBeenCalled();
    expect(paymentEventsService.createEvent).not.toHaveBeenCalled();
    expect(
      transactionsService.createTransactionsAndEvents,
    ).not.toHaveBeenCalled();
    expect(result).toEqual({
      sumPaymentAmountMultiplier: 1,
      programFspConfigurationNames: ['fspA'],
    });
  });

  it('should successfully run with dryRun=false and call all helpers', async () => {
    // Arrange
    jest.spyOn(service as any, 'createPaymentDryRunPart').mockResolvedValue({
      bulkActionResultPaymentDto: {
        sumPaymentAmountMultiplier: 1,
        programFspConfigurationNames: ['fspA'],
      },
      registrationsForPayment: [
        {
          referenceId: 'ref1',
          paymentAmountMultiplier: 1,
          programFspConfigurationName: 'fspA',
        },
      ],
      programFspConfigurationNames: ['fspA'],
    });
    (
      paymentsHelperService.checkFspConfigurationsOrThrow as jest.Mock
    ).mockResolvedValue(undefined);
    (service as any).getTransactionCreationDetails = jest
      .fn()
      .mockResolvedValue([{ detail: 'test' }]);
    (
      transactionsService.createTransactionsAndEvents as jest.Mock
    ).mockResolvedValue(undefined);

    // Act
    const result = await service.createPayment({
      ...basePaymentParams,
      dryRun: false,
    });

    // Assert
    expect(
      programPaymentsLocksService.unlockPaymentsForProgram,
    ).toHaveBeenCalledWith(basePaymentParams.programId);
    expect(paymentEventsService.createEvent).toHaveBeenCalledWith({
      userId: 1,
      paymentId: 123,
      type: PaymentEvent.created,
    });
    expect(
      transactionsService.createTransactionsAndEvents,
    ).toHaveBeenCalledWith({
      transactionCreationDetails: [{ detail: 'test' }],
      paymentId: 123,
      userId: 1,
    });
    expect(result).toEqual({
      sumPaymentAmountMultiplier: 1,
      programFspConfigurationNames: ['fspA'],
      id: 123,
    });
  });

  it('should call finally block even if error is thrown in try', async () => {
    (
      registrationsBulkService.getBulkActionResult as jest.Mock
    ).mockResolvedValue({});
    (
      registrationsPaginationService.getRegistrationViewsChunkedByPaginateQuery as jest.Mock
    ).mockResolvedValue([
      {
        referenceId: 'ref1',
        paymentAmountMultiplier: 1,
        programFspConfigurationName: 'fspA',
      },
    ]);
    jest
      .spyOn(service as any, 'createPaymentDryRunPart')
      .mockImplementation(() => {
        throw new Error('Simulated error');
      });
    await expect(service.createPayment(basePaymentParams)).rejects.toThrow(
      'Simulated error',
    );
    expect(
      programPaymentsLocksService.unlockPaymentsForProgram,
    ).toHaveBeenCalledWith(basePaymentParams.programId);
  });

  it('should return early if no transferValue', async () => {
    (
      registrationsBulkService.getBulkActionResult as jest.Mock
    ).mockResolvedValue({
      sumPaymentAmountMultiplier: 0,
      programFspConfigurationNames: [],
    });
    jest.spyOn(service as any, 'createPaymentDryRunPart').mockResolvedValue({
      bulkActionResultPaymentDto: {
        sumPaymentAmountMultiplier: 0,
        programFspConfigurationNames: [],
      },
      registrationsForPayment: [],
      programFspConfigurationNames: [],
    });
    const params = { ...basePaymentParams, transferValue: undefined };
    const result = await service.createPayment(params);
    expect(result).toEqual({
      sumPaymentAmountMultiplier: 0,
      programFspConfigurationNames: [],
    });
    expect(
      programPaymentsLocksService.unlockPaymentsForProgram,
    ).toHaveBeenCalledWith(basePaymentParams.programId);
  });
});
