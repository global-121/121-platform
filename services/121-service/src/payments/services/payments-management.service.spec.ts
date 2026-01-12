import { TestBed } from '@automock/jest';

import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventsService } from '@121-service/src/payments/payment-events/payment-events.service';
import { PaymentsHelperService } from '@121-service/src/payments/services/payments-helper.service';
import { PaymentsManagementService } from '@121-service/src/payments/services/payments-management.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { ApproverService } from '@121-service/src/user/approver/approver.service';
import { ApproverResponseDto } from '@121-service/src/user/approver/dto/approver-response.dto';

describe('PaymentsManagementService', () => {
  let service: PaymentsManagementService;
  let paymentsProgressHelperService: PaymentsProgressHelperService;
  let paymentsHelperService: PaymentsHelperService;
  let paymentEventsService: PaymentEventsService;
  let transactionsService: TransactionsService;
  let registrationsBulkService: RegistrationsBulkService;
  let registrationsPaginationService: RegistrationsPaginationService;
  let approverService: ApproverService;

  const basePaymentParams = {
    userId: 1,
    programId: 2,
    transferValue: 100,
    query: { path: 'test' },
    dryRun: false,
    note: 'test',
  };

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      PaymentsManagementService,
    ).compile();
    service = unit;
    paymentsProgressHelperService = unitRef.get(PaymentsProgressHelperService);
    paymentsHelperService = unitRef.get(PaymentsHelperService);
    paymentEventsService = unitRef.get(PaymentEventsService);
    transactionsService = unitRef.get(TransactionsService);
    registrationsBulkService = unitRef.get(RegistrationsBulkService);
    registrationsPaginationService = unitRef.get(
      RegistrationsPaginationService,
    );
    approverService = unitRef.get(ApproverService);
    (service as any).paymentRepository = {
      save: jest.fn().mockResolvedValue({ id: 123 }),
    };

    registrationsBulkService.getBaseQuery = jest
      .fn()
      .mockReturnValue({ andWhere: jest.fn().mockReturnThis() });
  });

  it('should handle dryRun scenario and not call write function', async () => {
    jest
      .spyOn(approverService as any, 'getApprovers')
      .mockResolvedValue([{ id: 1 }]);
    jest
      .spyOn(
        registrationsPaginationService as any,
        'getRegistrationViewsNoLimit',
      )
      .mockResolvedValue([
        {
          referenceId: 'ref1',
          paymentAmountMultiplier: 1,
          programFspConfigurationName: 'fspA',
        },
      ]);

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

  describe('createPaymentAndEventsEntities', () => {
    it('should assign correct rank/order in createPaymentAndEventsEntities', async () => {
      const approvers: ApproverResponseDto[] = [
        { id: 1, order: 20 } as any,
        { id: 2, order: 10 } as any,
        { id: 3, order: 30 } as any,
      ];

      await (service as any).createPaymentAndEventsEntities({
        userId: 2,
        programId: 3,
        approvers,
      });

      const expectedApprovals = [
        expect.objectContaining({ approverId: 2, rank: 1, approved: false }),
        expect.objectContaining({ approverId: 1, rank: 2, approved: false }),
        expect.objectContaining({ approverId: 3, rank: 3, approved: false }),
      ];
      expect((service as any).paymentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          approvals: expectedApprovals,
        }),
      );
    });
  });

  describe('approvePayment', () => {
    let paymentApprovalRepository: any;

    const mockApproverResponseDto = { id: 1 };

    beforeEach(() => {
      paymentApprovalRepository = {
        find: jest.fn(),
        save: jest.fn(),
        count: jest.fn(),
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

    it('should throw if approver has already approved payment', async () => {
      const approvals = [
        { approverId: 1, approved: true, rank: 1 },
        { approverId: 2, approved: false, rank: 2 },
      ];
      paymentApprovalRepository.find.mockResolvedValue(approvals);
      await expect(
        service.approvePayment({ userId: 1, programId: 2, paymentId: 3 }),
      ).rejects.toThrow('Approver has already approved this payment');
    });

    it('should throw if not lowest rank  approver', async () => {
      const approvals = [
        { approverId: 1, approved: false, rank: 2 },
        { approverId: 2, approved: false, rank: 1 },
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
        { approverId: 1, approved: false, rank: 1 },
        { approverId: 2, approved: false, rank: 2 },
      ];
      paymentApprovalRepository.find.mockResolvedValue(approvals);
      jest
        .spyOn(paymentEventsService, 'createApprovedEvent')
        .mockResolvedValue(undefined);

      await service.approvePayment({ userId: 1, programId: 2, paymentId: 3 });

      expect(approvals[0].approved).toBe(true);
      expect(paymentApprovalRepository.save).toHaveBeenCalledWith(approvals[0]);
      expect(paymentEventsService.createApprovedEvent).toHaveBeenCalled();
    });

    it('should call processFinalApproval if all approvals are approved', async () => {
      const approvals = [{ approverId: 1, approved: false, rank: 1 }];
      paymentApprovalRepository.find.mockResolvedValue(approvals);
      paymentApprovalRepository.count.mockResolvedValue(0);
      jest
        .spyOn(paymentEventsService, 'createApprovedEvent')
        .mockResolvedValue(undefined);
      const processFinalApprovalSpy = jest
        .spyOn(service as any, 'processFinalApproval')
        .mockResolvedValue(undefined);

      await service.approvePayment({ userId: 1, programId: 2, paymentId: 3 });

      expect(processFinalApprovalSpy).toHaveBeenCalled();
    });
  });
});
