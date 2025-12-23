import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventsService } from '@121-service/src/payments/payment-events/payment-events.service';
import { PaymentsHelperService } from '@121-service/src/payments/services/payments-helper.service';
import { PaymentsManagementService } from '@121-service/src/payments/services/payments-management.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { TransactionViewScopedRepository } from '@121-service/src/payments/transactions/repositories/transaction.view.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { ApproverService } from '@121-service/src/user/approver/approver.service';
import { PaymentApprovalRepository } from '@121-service/src/user/approver/repositories/payment-approval.repository';

describe('PaymentsManagementService', () => {
  let service: PaymentsManagementService;
  let paymentsProgressHelperService: PaymentsProgressHelperService;
  let paymentsHelperService: PaymentsHelperService;
  let paymentEventsService: PaymentEventsService;
  let transactionsService: TransactionsService;
  let registrationsBulkService: RegistrationsBulkService;
  let registrationsPaginationService: RegistrationsPaginationService;
  let approverService: ApproverService;
  let transactionViewScopedRepository: TransactionViewScopedRepository;
  let paymentApprovalRepository: PaymentApprovalRepository;

  const basePaymentParams = {
    userId: 1,
    programId: 2,
    transferValue: 100,
    query: { path: 'test' },
    dryRun: false,
    note: 'test',
  };

  beforeEach(() => {
    paymentsProgressHelperService = {
      checkPaymentInProgressAndThrow: jest.fn(),
      checkAndLockPaymentProgressOrThrow: jest.fn(),
      unlockPaymentsForProgram: jest.fn(),
    } as unknown as PaymentsProgressHelperService;

    paymentsHelperService = {
      checkFspConfigurationsOrThrow: jest.fn(),
    } as unknown as PaymentsHelperService;
    paymentEventsService = {
      createEvent: jest.fn(),
      createNoteEvent: jest.fn(),
    } as unknown as PaymentEventsService;
    transactionsService = {
      createTransactionsAndEvents: jest.fn(),
      saveProgressBulk: jest.fn(),
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
      getRegistrationViewsNoLimit: jest.fn().mockResolvedValue([
        {
          referenceId: 'ref1',
          paymentAmountMultiplier: 1,
          programFspConfigurationName: 'fspA',
        },
      ]),
    } as unknown as RegistrationsPaginationService;
    approverService = {
      getApprovers: jest.fn().mockResolvedValue([{ id: 1 }]),
      getApproverByUserIdOrThrow: jest.fn().mockResolvedValue({ id: 1 }),
    } as unknown as ApproverService;
    transactionViewScopedRepository = {
      getByStatusOfIncludedRegistrations: jest
        .fn()
        .mockResolvedValue([{ id: 1 }]),
    } as unknown as TransactionViewScopedRepository;
    paymentApprovalRepository = {
      find: jest.fn(),
      save: jest.fn(),
    } as unknown as PaymentApprovalRepository;

    service = new PaymentsManagementService(
      registrationsBulkService,
      registrationsPaginationService,
      paymentsHelperService,
      paymentEventsService,
      paymentsProgressHelperService,
      transactionsService,
      approverService,
      transactionViewScopedRepository,
      paymentApprovalRepository,
    );
    (service as any).paymentRepository = {
      save: jest.fn().mockResolvedValue({ id: 123 }),
    };
  });

  it('should handle dryRun scenario and not call write function', async () => {
    const params = { ...basePaymentParams, dryRun: true };
    const result = await service.createPayment(params);

    expect(
      paymentsProgressHelperService.checkAndLockPaymentProgressOrThrow,
    ).not.toHaveBeenCalled();
    expect(
      paymentsProgressHelperService.unlockPaymentsForProgram,
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
    jest
      .spyOn(service as any, 'getPaymentDryRunDetailsOrThrow')
      .mockResolvedValue({
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
        approvers: [{ id: 1 }],
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
      paymentsProgressHelperService.unlockPaymentsForProgram,
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
    jest
      .spyOn(service as any, 'getPaymentDryRunDetailsOrThrow')
      .mockImplementation(() => {
        throw new Error('Simulated error');
      });
    await expect(service.createPayment(basePaymentParams)).rejects.toThrow(
      'Simulated error',
    );
    expect(
      paymentsProgressHelperService.unlockPaymentsForProgram,
    ).toHaveBeenCalledWith(basePaymentParams.programId);
  });

  it('should return early if no transferValue', async () => {
    (
      registrationsBulkService.getBulkActionResult as jest.Mock
    ).mockResolvedValue({
      sumPaymentAmountMultiplier: 0,
      programFspConfigurationNames: [],
    });
    jest
      .spyOn(service as any, 'getPaymentDryRunDetailsOrThrow')
      .mockResolvedValue({
        bulkActionResultPaymentDto: {
          sumPaymentAmountMultiplier: 0,
          programFspConfigurationNames: [],
        },
        registrationsForPayment: [
          {
            referenceId: 'ref1',
            paymentAmountMultiplier: 1,
            programFspConfigurationName: 'fspA',
          },
        ],
        programFspConfigurationNames: [],
      });
    const params = { ...basePaymentParams, transferValue: undefined };
    const result = await service.createPayment(params);
    expect(result).toEqual({
      sumPaymentAmountMultiplier: 0,
      programFspConfigurationNames: [],
    });
    expect(
      paymentsProgressHelperService.unlockPaymentsForProgram,
    ).toHaveBeenCalledWith(basePaymentParams.programId);
  });

  describe('approvePayment', () => {
    let paymentApprovalRepository: any;

    const mockApproverResponseDto = { id: 1 };

    beforeEach(() => {
      paymentApprovalRepository = {
        find: jest.fn(),
        save: jest.fn(),
      };
      (service as any).paymentApprovalRepository = paymentApprovalRepository;
      (approverService as any).getApproverByUserIdOrThrow = jest
        .fn()
        .mockResolvedValue(mockApproverResponseDto);
    });

    it('should throw if approver is not assigned to payment', async () => {
      paymentApprovalRepository.find.mockResolvedValue([]);
      await expect(
        service.approvePayment({ userId: 1, programId: 2, paymentId: 3 }),
      ).rejects.toThrow('Approver not assigned to this payment');
    });

    it('should throw if not lowest order approver', async () => {
      const approvals = [
        { approverId: 1, approved: false, order: 2 },
        { approverId: 2, approved: false, order: 1 },
      ];
      paymentApprovalRepository.find.mockResolvedValue(approvals);
      await expect(
        service.approvePayment({ userId: 1, programId: 2, paymentId: 3 }),
      ).rejects.toThrow(
        'Cannot approve payment before lower-order approvers have approved',
      );
    });

    it('should approve the payment for the approver and save', async () => {
      const approvals = [
        { approverId: 1, approved: false, order: 1 },
        { approverId: 2, approved: false, order: 2 },
      ];
      paymentApprovalRepository.find.mockResolvedValue(approvals);
      jest
        .spyOn(paymentEventsService, 'createEvent')
        .mockResolvedValue(undefined);

      await service.approvePayment({ userId: 1, programId: 2, paymentId: 3 });

      expect(approvals[0].approved).toBe(true);
      expect(paymentApprovalRepository.save).toHaveBeenCalledWith(approvals[0]);
      expect(paymentEventsService.createEvent).toHaveBeenCalled();
    });

    it('should call processFinalApproval if all approvals are approved', async () => {
      const approvals = [{ approverId: 1, approved: false, order: 1 }];
      paymentApprovalRepository.find.mockResolvedValue(approvals);
      jest
        .spyOn(paymentEventsService, 'createEvent')
        .mockResolvedValue(undefined);
      const processFinalApprovalSpy = jest
        .spyOn(service as any, 'processFinalApproval')
        .mockResolvedValue(undefined);

      await service.approvePayment({ userId: 1, programId: 2, paymentId: 3 });

      expect(processFinalApprovalSpy).toHaveBeenCalled();
    });
  });
});
