import { TestBed } from '@automock/jest';

import { PaymentRepository } from '@121-service/src/payments/repositories/payment.repository';
import { PaymentsReportingHelperService } from '@121-service/src/payments/services/payments-reporting.helper.service';
import { PaymentsReportingService } from '@121-service/src/payments/services/payments-reporting.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionViewScopedRepository } from '@121-service/src/payments/transactions/repositories/transaction.view.scoped.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationViewsMapper } from '@121-service/src/registration/mappers/registration-views.mapper';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';

function createMockTransaction(
  referenceId: string,
  amount: number,
  status: TransactionStatusEnum,
) {
  return {
    id: 1,
    created: new Date(),
    updated: new Date(),
    paymentId: 1,
    paymentDate: new Date(),
    status,
    amount,
    errorMessage: null,
    programFspConfigurationName: 'someFsp',
    registrationProgramId: 2,
    registrationId: 3,
    registrationStatus: RegistrationStatusEnum.included,
    registrationScope: 'some-scope',
    registrationReferenceId: referenceId,
  };
}

const mockTransactions = [
  createMockTransaction('101', 100, TransactionStatusEnum.success),
  createMockTransaction('102', 200, TransactionStatusEnum.success),
];

const mockPaginate = jest.fn();
jest.mock('nestjs-paginate', () => ({
  paginate: (...args) => mockPaginate(...args),
  FilterOperator: {
    // The filter operators need to be defined for the tests to run
    EQ: '$eq',
    IN: '$in',
    ILIKE: '$ilike',
    NULL: '$null',
    NOT: '$not',
    GTE: '$gte',
    GT: '$gt',
    LTE: '$lte',
    LT: '$lt',
    BTW: '$btw',
  },
  FilterSuffix: {
    NOT: '$not',
  },
}));

describe('PaymentsReportingService - getTransactions', () => {
  let service: PaymentsReportingService;
  let transactionScopedRepository: TransactionViewScopedRepository;
  let registrationPaginationService: RegistrationsPaginationService;
  let programRegistrationAttributeRepository: ProgramRegistrationAttributeRepository;
  let paymentsHelperService: PaymentsReportingHelperService;
  let paymentRepository: PaymentRepository;
  let programRepository: ProgramRepository;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      PaymentsReportingService,
    ).compile();

    transactionScopedRepository = unitRef.get(TransactionViewScopedRepository);

    service = unit;
    registrationPaginationService = unitRef.get(RegistrationsPaginationService);

    jest.spyOn(transactionScopedRepository, 'getTransactions');
    jest.spyOn(
      registrationPaginationService,
      'getRegistrationViewsByReferenceIds',
    );

    registrationPaginationService = unitRef.get(RegistrationsPaginationService);
    programRegistrationAttributeRepository = unitRef.get(
      ProgramRegistrationAttributeRepository,
    );
    paymentsHelperService = unitRef.get(PaymentsReportingHelperService);
    paymentRepository = unitRef.get(PaymentRepository);
    programRepository = unitRef.get(ProgramRepository);

    jest.spyOn<any, any>(service, 'getTransactions');
    jest.spyOn(paymentsHelperService, 'getSelectForExport');
    jest.spyOn(programRegistrationAttributeRepository, 'getDropdownAttributes');
    jest.spyOn(
      RegistrationViewsMapper,
      'replaceDropdownValuesWithEnglishLabel',
    );
    jest.spyOn(paymentRepository, 'findOne').mockResolvedValue({});
    jest.spyOn(programRepository, 'findOneOrFail').mockResolvedValue({
      enableScope: true,
    } as any);
  });

  describe('getTransactionsByPaymentId', () => {
    it('should return transactions', async () => {
      // Arrange
      const programId = 1;
      const paymentId = 2;

      const mockRegistrationViews = [
        { referenceId: '101' },
        { referenceId: '102' },
      ] as MappedPaginatedRegistrationDto[];

      jest
        .spyOn(transactionScopedRepository, 'getTransactions')
        .mockResolvedValue(mockTransactions);

      jest
        .spyOn(
          registrationPaginationService,
          'getRegistrationViewsByReferenceIds',
        )
        .mockResolvedValue(mockRegistrationViews);

      mockPaginate.mockResolvedValueOnce({
        data: mockTransactions,
        meta: {},
        links: {},
      });

      // Act
      const result =
        await service.getTransactionsByPaymentIdPaginatedAndSetDefaultLimit({
          programId,
          paymentId,
          paginateQuery: { path: '' },
        });
      const data = result.data;
      const meta = result.meta;

      // Assert
      expect(data).toEqual([
        { ...mockTransactions[0] },
        { ...mockTransactions[1] },
      ]);
      expect(meta).toBeDefined();
    });

    it('should throw 404 if payment does not exist', async () => {
      // Arrange
      const programId = 1;
      const paymentId = 999;
      // Simulate paymentRepository.findOne returning undefined
      (paymentRepository.findOne as jest.Mock).mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        service.getTransactionsByPaymentIdPaginatedAndSetDefaultLimit({
          programId,
          paymentId,
          paginateQuery: { path: '' },
        }),
      ).rejects.toMatchSnapshot();
    });

    it('should return empty array when no transactions found', async () => {
      // Arrange
      const programId = 1;
      const paymentId = 2;

      mockPaginate.mockResolvedValueOnce({ data: [], meta: {}, links: {} });

      // Act
      const result =
        await service.getTransactionsByPaymentIdPaginatedAndSetDefaultLimit({
          programId,
          paymentId,
          paginateQuery: { path: '' },
        });

      // Assert
      const data = result.data;
      expect(data).toEqual([]);
    });
  });

  describe('exportTransactionsUsingDateFilter', () => {
    it('should call return formatted fileDto', async () => {
      // Arrange
      const programId = 1;
      const fromDateString = '2024-01-01T00:00:00.000Z';
      const toDateString = '2024-01-31T23:59:59.000Z';
      const select = ['name', 'foo'];
      const transactions = [{ registrationReferenceId: 'ref1', name: 'Alice' }];
      const dropdownAttributes = [
        { name: 'foo', options: [{ value: 'bar', label: 'Bar' }] },
      ];
      const replacedRows = [
        { registrationReferenceId: 'ref1', name: 'Alice', foo: 'Bar' },
      ];
      const fileName = 'transactions_1_2024-01-01T00-00-00_2024-01-31T23-59-59';

      (paymentsHelperService.getSelectForExport as jest.Mock).mockResolvedValue(
        select,
      );
      (service as any).getTransactions.mockResolvedValue(transactions);
      (
        programRegistrationAttributeRepository.getDropdownAttributes as jest.Mock
      ).mockResolvedValue(dropdownAttributes);
      (
        RegistrationViewsMapper.replaceDropdownValuesWithEnglishLabel as jest.Mock
      ).mockReturnValue(replacedRows);

      (
        paymentsHelperService.createTransactionsExportFilename as jest.Mock
      ).mockReturnValue(fileName);

      // Act
      const result = await service.exportTransactionsUsingDateFilter({
        programId,
        fromDateString,
        toDateString,
      });

      // Assert
      expect(result.data).toEqual(replacedRows);
      expect(result.fileName).toEqual(fileName);
    });
  });

  describe('getPaymentEvents', () => {
    it('should throw 404 if payment does not exist', async () => {
      // Arrange
      const programId = 1;
      const paymentId = 999;
      (paymentRepository.findOne as jest.Mock).mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        service.getPaymentEvents({ programId, paymentId }),
      ).rejects.toMatchSnapshot();
    });
  });

  describe('getPaymentAggregationsSummaries', () => {
    it('should limit the number of payments when limitNumberOfPayments is provided', async () => {
      // Arrange
      const programId = 1;
      const limitNumberOfPayments = 2;

      const mockSummaries = [
        {
          paymentId: 1,
          paymentDate: new Date('2024-01-15T10:00:00Z'),
          isPaymentApproved: true,
          approvalsRequired: 2,
          approvalsGiven: 2,
          success: { count: 10, transferValue: 1000 },
          waiting: { count: 0, transferValue: 0 },
          failed: { count: 0, transferValue: 0 },
          pendingApproval: { count: 0, transferValue: 0 },
          approved: { count: 0, transferValue: 0 },
        },
        {
          paymentId: 2,
          paymentDate: new Date('2024-01-20T10:00:00Z'),
          isPaymentApproved: false,
          approvalsRequired: 2,
          approvalsGiven: 1,
          success: { count: 0, transferValue: 0 },
          waiting: { count: 5, transferValue: 500 },
          failed: { count: 0, transferValue: 0 },
          pendingApproval: { count: 0, transferValue: 0 },
          approved: { count: 0, transferValue: 0 },
        },
        {
          paymentId: 3,
          paymentDate: new Date('2024-01-25T10:00:00Z'),
          isPaymentApproved: false,
          approvalsRequired: 1,
          approvalsGiven: 0,
          success: { count: 0, transferValue: 0 },
          waiting: { count: 0, transferValue: 0 },
          failed: { count: 2, transferValue: 200 },
          pendingApproval: { count: 0, transferValue: 0 },
          approved: { count: 0, transferValue: 0 },
        },
      ];

      jest
        .spyOn(paymentRepository as any, 'getPaymentsAndApprovalState')
        .mockResolvedValue([]); // Return empty array as the actual values are not relevant for this test

      jest
        .spyOn(
          transactionScopedRepository,
          'aggregateTransactionsByStatusForAllPayments',
        )
        .mockResolvedValue([]); // Return empty array as the actual values are not relevant for this test

      jest
        .spyOn(paymentsHelperService, 'buildPaymentAggregationSummaries')
        .mockReturnValue(mockSummaries);

      // Act
      const result = await service.getPaymentAggregationsSummaries({
        programId,
        limitNumberOfPayments,
      });

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toEqual([mockSummaries[0], mockSummaries[1]]);
      expect(result).not.toContain(mockSummaries[2]);
    });
  });

  describe('getPaymentAggregationFull', () => {
    it('should return full payment aggregation data', async () => {
      // Arrange
      const programId = 1;
      const paymentId = 2;

      const mockSummary = {
        paymentId: 2,
        paymentDate: new Date('2024-01-15T10:00:00Z'),
        isPaymentApproved: true,
        approvalsRequired: 2,
        approvalsGiven: 2,
        success: { count: 10, transferValue: 1000 },
        waiting: { count: 0, transferValue: 0 },
        failed: { count: 0, transferValue: 0 },
        pendingApproval: { count: 0, transferValue: 0 },
        approved: { count: 0, transferValue: 0 },
      };

      const mockFsps = [
        {
          programFspConfigurationName: 'fsp1',
          programFspConfigurationLabel: { en: 'FSP 1' },
        },
        {
          programFspConfigurationName: 'fsp2',
          programFspConfigurationLabel: { en: 'FSP 2' },
        },
      ];
      const mockApprovalStatus = [];

      jest
        .spyOn(service, 'getPaymentAggregationsSummaries')
        .mockResolvedValue([mockSummary]);
      jest
        .spyOn(transactionScopedRepository, 'getAllFspsInPayment')
        .mockResolvedValue(mockFsps);
      jest
        .spyOn(service, 'getPaymentApprovalStatus')
        .mockResolvedValue(mockApprovalStatus);

      // Act
      const result = await service.getPaymentAggregationFull({
        programId,
        paymentId,
      });

      // Assert
      expect(result).toEqual({
        ...mockSummary,
        fsps: mockFsps,
        approvalStatus: mockApprovalStatus,
      });
    });

    it('should throw 404 if payment does not exist', async () => {
      // Arrange
      const programId = 1;
      const paymentId = 999;
      (paymentRepository.findOne as jest.Mock).mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        service.getPaymentAggregationFull({ programId, paymentId }),
      ).rejects.toMatchSnapshot();
    });
  });
});
