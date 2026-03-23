import { TestBed } from '@automock/jest';
import { HttpStatus } from '@nestjs/common';

import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventsService } from '@121-service/src/payments/payment-events/payment-events.service';
import { PaymentsHelperService } from '@121-service/src/payments/services/payments-helper.service';
import { PaymentsManagementService } from '@121-service/src/payments/services/payments-management.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { TransactionViewScopedRepository } from '@121-service/src/payments/transactions/repositories/transaction.view.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';
import { ProgramApprovalThresholdRepository } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.repository';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';

import '@121-service/src/utils/test-helpers/matchers/httpExceptionMatcher';

describe('PaymentsManagementService', () => {
  let service: PaymentsManagementService;
  let paymentsProgressHelperService: PaymentsProgressHelperService;
  let paymentsHelperService: PaymentsHelperService;
  let paymentEventsService: PaymentEventsService;
  let transactionsService: TransactionsService;
  let registrationsBulkService: RegistrationsBulkService;
  let registrationsPaginationService: RegistrationsPaginationService;
  let programApprovalThresholdRepository: ProgramApprovalThresholdRepository;
  let transactionViewScopedRepository: TransactionViewScopedRepository;

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
    programApprovalThresholdRepository = unitRef.get(
      ProgramApprovalThresholdRepository,
    );
    transactionViewScopedRepository = unitRef.get(
      TransactionViewScopedRepository,
    );
    (service as any).paymentRepository = {
      save: jest.fn().mockImplementation((entity) => {
        return Promise.resolve({ ...entity, id: 123 });
      }),
    };
    registrationsBulkService.getBaseQuery = jest
      .fn()
      .mockReturnValue({ andWhere: jest.fn().mockReturnThis() });
  });

  it('should handle dryRun scenario and not call write function', async () => {
    // Arrange
    jest
      .spyOn(
        programApprovalThresholdRepository as any,
        'getThresholdsForPaymentAmount',
      )
      .mockResolvedValue([{ id: 1, thresholdAmount: 0 }]);
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

    // Act
    const result = await service.createPayment(params);

    // Assert
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
        thresholds: [{ id: 1, thresholdAmount: 0 }],
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
    // Arrange
    (
      registrationsBulkService.getBulkActionResult as jest.Mock
    ).mockResolvedValue({});
    jest
      .spyOn(service as any, 'getPaymentDryRunDetailsOrThrow')
      .mockImplementation(() => {
        throw new Error('Simulated error');
      });

    // Act & Assert
    await expect(service.createPayment(basePaymentParams)).rejects.toThrow(
      'Simulated error',
    );
    expect(
      paymentsProgressHelperService.unlockPaymentsForProgram,
    ).toHaveBeenCalledWith(basePaymentParams.programId);
  });

  it('should return early if no transferValue', async () => {
    // Arrange
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
        thresholds: [],
      });
    const params = { ...basePaymentParams, transferValue: undefined };

    // Act
    const result = await service.createPayment(params);

    // Assert
    expect(result).toEqual({
      sumPaymentAmountMultiplier: 0,
      programFspConfigurationNames: [],
    });
    expect(
      paymentsProgressHelperService.unlockPaymentsForProgram,
    ).toHaveBeenCalledWith(basePaymentParams.programId);
  });

  describe('createPaymentAndEventsEntities', () => {
    it('should assign correct rank based on thresholdAmount in createPaymentAndEventsEntities', async () => {
      // Arrange
      const thresholds = [
        { id: 1, thresholdAmount: 100, approverAssignments: [] },
        { id: 2, thresholdAmount: 0, approverAssignments: [] },
        { id: 3, thresholdAmount: 500, approverAssignments: [] },
      ] as unknown as ProgramApprovalThresholdEntity[];

      // Act
      await (service as any).createPaymentAndEventsEntities({
        userId: 2,
        programId: 3,
        thresholds,
      });

      // Assert
      const expectedApprovals = [
        expect.objectContaining({
          rank: 1,
          approved: false,
        }),
        expect.objectContaining({
          rank: 2,
          approved: false,
        }),
        expect.objectContaining({
          rank: 3,
          approved: false,
        }),
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

    beforeEach(() => {
      paymentApprovalRepository = {
        getCurrentApprovalStep: jest.fn(),
        save: jest.fn(),
        count: jest.fn(),
      };
      (service as any).paymentApprovalRepository = paymentApprovalRepository;
    });

    it('should throw if payment is already fully approved', async () => {
      // Arrange
      paymentApprovalRepository.getCurrentApprovalStep.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.approvePayment({ userId: 1, programId: 2, paymentId: 3 }),
      ).rejects.toMatchObject({
        message: 'Payment is already fully approved, cannot approve it',
        status: 400,
      });
    });

    it('should throw if user is not assigned to the current approval step', async () => {
      // Arrange
      paymentApprovalRepository.getCurrentApprovalStep.mockResolvedValue({
        id: 1,
        rank: 1,
        approved: false,
        approverAssignments: [],
      });

      // Act & Assert
      await expect(
        service.approvePayment({ userId: 1, programId: 2, paymentId: 3 }),
      ).rejects.toMatchObject({
        message:
          'User is not assigned to the current approval step and cannot approve it',
        status: 403,
      });
    });

    it('should approve the current step and save', async () => {
      // Arrange
      const currentStep = {
        id: 1,
        approved: false,
        rank: 1,
        approverAssignments: [{ userId: 1 }],
      };
      paymentApprovalRepository.getCurrentApprovalStep.mockResolvedValue(
        currentStep,
      );
      paymentApprovalRepository.count
        .mockResolvedValueOnce(2) // totalApprovals
        .mockResolvedValueOnce(1); // notCompletedApprovals > 0, no final approval
      jest
        .spyOn(paymentEventsService, 'createApprovedEvent')
        .mockResolvedValue(undefined);

      // Act
      await service.approvePayment({ userId: 1, programId: 2, paymentId: 3 });

      // Assert
      expect(currentStep.approved).toBe(true);
      expect(paymentApprovalRepository.save).toHaveBeenCalledWith(currentStep);
      expect(paymentEventsService.createApprovedEvent).toHaveBeenCalled();
    });

    it('should call processFinalApproval if all steps are approved', async () => {
      // Arrange
      const currentStep = {
        id: 1,
        approved: false,
        rank: 1,
        approverAssignments: [{ userId: 1 }],
      };
      paymentApprovalRepository.getCurrentApprovalStep.mockResolvedValue(
        currentStep,
      );
      paymentApprovalRepository.count
        .mockResolvedValueOnce(1) // totalApprovals
        .mockResolvedValueOnce(0); // notCompletedApprovals = 0, triggers final approval
      jest
        .spyOn(paymentEventsService, 'createApprovedEvent')
        .mockResolvedValue(undefined);
      const processFinalApprovalSpy = jest
        .spyOn(service as any, 'processFinalApproval')
        .mockResolvedValue(undefined);

      // Act
      await service.approvePayment({ userId: 1, programId: 2, paymentId: 3 });

      // Assert
      expect(processFinalApprovalSpy).toHaveBeenCalled();
    });
  });

  describe('deletePayment', () => {
    const deleteParams = { programId: 2, paymentId: 5 };

    beforeEach(() => {
      (service as any).paymentRepository.findOne = jest
        .fn()
        .mockResolvedValue({ id: 5, programId: 2 });
      (service as any).paymentRepository.remove = jest
        .fn()
        .mockResolvedValue(undefined);
      (
        paymentsProgressHelperService.isPaymentInProgress as jest.Mock
      ).mockResolvedValue(false);
      (
        transactionViewScopedRepository.hasBeenStarted as jest.Mock
      ).mockResolvedValue(false);
    });

    it('should throw NOT_FOUND if payment does not exist', async () => {
      // Arrange
      (service as any).paymentRepository.findOne = jest
        .fn()
        .mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.deletePayment(deleteParams),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.NOT_FOUND);
    });

    it('should throw if payment is in progress', async () => {
      // Arrange
      (
        paymentsProgressHelperService.isPaymentInProgress as jest.Mock
      ).mockResolvedValue(true);

      // Act & Assert
      await expect(
        service.deletePayment(deleteParams),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    });

    it('should throw if payment has already been started', async () => {
      // Arrange
      (
        transactionViewScopedRepository.hasBeenStarted as jest.Mock
      ).mockResolvedValue(true);

      // Act & Assert
      await expect(
        service.deletePayment(deleteParams),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    });

    it('should remove the payment when it has not been started', async () => {
      // Act
      await service.deletePayment(deleteParams);

      // Assert
      expect((service as any).paymentRepository.remove).toHaveBeenCalledWith({
        id: 5,
        programId: 2,
      });
    });
  });
});
