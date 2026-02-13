import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SafaricomTransferEntity } from '@121-service/src/fsp-integrations/integrations/safaricom/entities/safaricom-transfer.entity';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { PaymentsReportingHelperService } from '@121-service/src/payments/services/payments-reporting.helper.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';
import {
  DefaultRegistrationDataAttributeNames,
  GenericRegistrationAttributes,
} from '@121-service/src/registration/enum/registration-attribute.enum';

describe('PaymentsReportingHelperService', () => {
  let service: PaymentsReportingHelperService;
  let programRepository: Repository<ProgramEntity>;
  let programRegistrationAttributeRepository: ProgramRegistrationAttributeRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsReportingHelperService,
        {
          provide: getRepositoryToken(ProgramEntity),
          useValue: {
            findOneByOrFail: jest.fn(),
            findOneOrFail: jest.fn(),
          },
        },
        {
          provide: ProgramRegistrationAttributeRepository,
          useValue: {
            find: jest.fn().mockReturnValue(() => []),
          },
        },
      ],
    }).compile();

    service = module.get(PaymentsReportingHelperService);
    programRepository = module.get(getRepositoryToken(ProgramEntity));
    programRegistrationAttributeRepository = module.get(
      ProgramRegistrationAttributeRepository,
    );
  });

  describe('getSelectForExport', () => {
    const defaultSelect = [
      DefaultRegistrationDataAttributeNames.name,
      GenericRegistrationAttributes.registrationProgramId,
      GenericRegistrationAttributes.phoneNumber,
      GenericRegistrationAttributes.preferredLanguage,
      GenericRegistrationAttributes.paymentAmountMultiplier,
      GenericRegistrationAttributes.programFspConfigurationLabel,
      GenericRegistrationAttributes.paymentCount,
    ];

    it('returns export attributes', async () => {
      // Arrange
      const customAttributeName1 = 'custom1';
      const customAttributeName2 = 'custom2';
      (programRepository.findOneByOrFail as jest.Mock).mockResolvedValue({
        enableMaxPayments: false,
        enableScope: false,
      });
      (
        programRegistrationAttributeRepository.find as jest.Mock
      ).mockResolvedValue([
        { name: customAttributeName1 },
        { name: customAttributeName2 },
      ]);

      // Act
      const result = await service.getSelectForExport(1);

      // Assert
      const expectedAttributes = [
        ...defaultSelect,
        customAttributeName1,
        customAttributeName2,
      ];
      expect(result).toStrictEqual(expectedAttributes);
    });

    it('includes maxPayments and scope if enabled', async () => {
      // Arrange
      (programRepository.findOneByOrFail as jest.Mock).mockResolvedValue({
        enableMaxPayments: true,
        enableScope: true,
      });
      (
        programRegistrationAttributeRepository.find as jest.Mock
      ).mockResolvedValue([]);

      // Act
      const result = await service.getSelectForExport(1);

      // Assert
      const expectedAttributes = [
        ...defaultSelect,
        GenericRegistrationAttributes.maxPayments,
        GenericRegistrationAttributes.scope,
      ];
      expect(result).toStrictEqual(expectedAttributes);
    });
  });

  describe('getFspSpecificJoinFields', () => {
    it('returns Safaricom join fields', async () => {
      // Arrange
      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        programFspConfigurations: [{ fspName: Fsps.safaricom }],
      });

      // Act
      const result = await service.getFspSpecificJoinFields(1);

      // Assert
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            entityJoinedToTransaction: SafaricomTransferEntity,
            attribute: 'mpesaTransactionId',
            alias: 'mpesaTransactionId',
          }),
        ]),
      );
    });

    it('returns Nedbank join fields', async () => {
      // Arrange
      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        programFspConfigurations: [{ fspName: Fsps.nedbank }],
      });

      // Act
      const result = await service.getFspSpecificJoinFields(1);

      // Assert
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            attribute: 'status',
            alias: 'nedbankVoucherStatus',
          }),
          expect.objectContaining({
            attribute: 'orderCreateReference',
            alias: 'nedbankOrderCreateReference',
          }),
          expect.objectContaining({
            attribute: 'paymentReference',
            alias: 'nedbankPaymentReference',
          }),
        ]),
      );
    });

    it('returns empty array if no matching FSPs', async () => {
      // Arrange
      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        programFspConfigurations: [],
      });
      // Act
      const result = await service.getFspSpecificJoinFields(1);
      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('createTransactionsExportFilename', () => {
    it('should include all parts when all arguments are provided', () => {
      // Arrange
      const programId = 42;
      const fromDate = new Date('2024-01-01T12:00:00Z');
      const toDate = new Date('2024-01-31T18:30:00Z');
      const payment = 3;
      const fromDateString = '2024-01-01T12-00-00';
      const toDateString = '2024-01-31T18-30-00';
      const paymentString = `payment_${payment}`;
      const expected = `transactions_${programId}_${fromDateString}_${toDateString}_${paymentString}`;

      // Act
      const result = service.createTransactionsExportFilename(
        programId,
        fromDate,
        toDate,
        payment,
      );

      // Assert
      expect(result).toBe(expected);
    });

    it('should omit fromDate if not provided', () => {
      // Arrange
      const programId = 1;
      const toDate = new Date('2024-02-01T00:00:00Z');
      const payment = 2;
      const toDateString = '2024-02-01T00-00-00';
      const paymentString = `payment_${payment}`;
      const expected = `transactions_${programId}_${toDateString}_${paymentString}`;

      // Act
      const result = service.createTransactionsExportFilename(
        programId,
        undefined,
        toDate,
        payment,
      );

      // Assert
      expect(result).toBe(expected);
    });

    it('should omit toDate if not provided', () => {
      // Arrange
      const programId = 5;
      const fromDate = new Date('2024-03-01T10:00:00Z');
      const payment = 7;
      const fromDateString = '2024-03-01T10-00-00';
      const paymentString = `payment_${payment}`;
      const expected = `transactions_${programId}_${fromDateString}_${paymentString}`;

      // Act
      const result = service.createTransactionsExportFilename(
        programId,
        fromDate,
        undefined,
        payment,
      );

      // Assert
      expect(result).toBe(expected);
    });

    it('should omit payment if not provided', () => {
      // Arrange
      const programId = 9;
      const fromDate = new Date('2024-04-01T08:00:00Z');
      const toDate = new Date('2024-04-30T20:00:00Z');
      const fromDateString = '2024-04-01T08-00-00';
      const toDateString = '2024-04-30T20-00-00';
      const expected = `transactions_${programId}_${fromDateString}_${toDateString}`;

      // Act
      const result = service.createTransactionsExportFilename(
        programId,
        fromDate,
        toDate,
        undefined,
      );

      // Assert
      expect(result).toBe(expected);
    });

    it('should only include programId if nothing else is provided', () => {
      // Arrange
      const programId = 99;
      const expected = `transactions_${programId}`;

      // Act
      const result = service.createTransactionsExportFilename(programId);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe('buildPaymentAggregationSummaries', () => {
    const expectZeroStatusValues = () => ({
      success: { count: 0, transferValue: 0 },
      waiting: { count: 0, transferValue: 0 },
      failed: { count: 0, transferValue: 0 },
      pendingApproval: { count: 0, transferValue: 0 },
      approved: { count: 0, transferValue: 0 },
    });

    it('should correctly map payment and aggregation data to PaymentAggregationSummaryDto', () => {
      // Arrange
      const paymentsAndApprovalStatuses = [
        {
          id: 1,
          created: new Date('2024-01-15T10:00:00Z'),
          isPaymentApproved: true,
          approvalsRequired: 2,
          approvalsGiven: 2,
        },
        {
          id: 4,
          created: new Date('2024-02-05T14:00:00Z'),
          isPaymentApproved: true,
          approvalsRequired: 1,
          approvalsGiven: 1,
        },
      ];

      const aggregationResults = [
        {
          paymentId: 1,
          paymentDate: new Date('2024-01-15T10:00:00Z'),
          status: TransactionStatusEnum.success,
          count: '10',
          totalTransferValue: '1000.50',
        },
        {
          paymentId: 1,
          paymentDate: new Date('2024-01-15T10:00:00Z'),
          status: TransactionStatusEnum.waiting,
          count: '5',
          totalTransferValue: '500.25',
        },
        {
          paymentId: 1,
          paymentDate: new Date('2024-01-15T10:00:00Z'),
          status: TransactionStatusEnum.error,
          count: '2',
          totalTransferValue: '200.00',
        },
        {
          paymentId: 4,
          paymentDate: new Date('2024-02-05T14:00:00Z'),
          status: TransactionStatusEnum.pendingApproval,
          count: '8',
          totalTransferValue: '800.00',
        },
        {
          paymentId: 4,
          paymentDate: new Date('2024-02-05T14:00:00Z'),
          status: TransactionStatusEnum.approved,
          count: '3',
          totalTransferValue: '300.00',
        },
      ];

      // Act
      const result = service.buildPaymentAggregationSummaries({
        paymentsAndApprovalStatusses: paymentsAndApprovalStatuses,
        aggregationResults,
      });

      // Assert
      expect(result).toHaveLength(2);

      // Check first payment
      expect(result[0]).toEqual({
        paymentId: 1,
        paymentDate: new Date('2024-01-15T10:00:00Z'),
        isPaymentApproved: true,
        approvalsRequired: 2,
        approvalsGiven: 2,
        success: { count: 10, transferValue: 1000.5 },
        waiting: { count: 5, transferValue: 500.25 },
        failed: { count: 2, transferValue: 200 },
        pendingApproval: { count: 0, transferValue: 0 },
        approved: { count: 0, transferValue: 0 },
      });

      // Check second payment
      expect(result[1]).toEqual({
        paymentId: 4,
        paymentDate: new Date('2024-02-05T14:00:00Z'),
        isPaymentApproved: true,
        approvalsRequired: 1,
        approvalsGiven: 1,
        success: { count: 0, transferValue: 0 },
        waiting: { count: 0, transferValue: 0 },
        failed: { count: 0, transferValue: 0 },
        pendingApproval: { count: 8, transferValue: 800 },
        approved: { count: 3, transferValue: 300 },
      });
    });

    it('should handle payments with no aggregation results (all zero values)', () => {
      // Arrange
      const paymentsAndApprovalStatuses = [
        {
          id: 3,
          created: new Date('2024-02-01T10:00:00Z'),
          isPaymentApproved: false,
          approvalsRequired: 1,
          approvalsGiven: 0,
        },
        {
          id: 4,
          created: new Date('2024-02-05T14:00:00Z'),
          isPaymentApproved: true,
          approvalsRequired: 1,
          approvalsGiven: 1,
        },
      ];

      // Empty aggregation results - edge case where no transactions exist yet
      const aggregationResults: {
        paymentId: number;
        paymentDate: Date;
        status: TransactionStatusEnum;
        count: string;
        totalTransferValue: string;
      }[] = [];

      // Act
      const result = service.buildPaymentAggregationSummaries({
        paymentsAndApprovalStatusses: paymentsAndApprovalStatuses,
        aggregationResults,
      });

      // Assert
      expect(result).toHaveLength(2);

      // Both payments should have zero counts and values for all statuses
      expect(result[0]).toEqual({
        paymentId: 3,
        paymentDate: new Date('2024-02-01T10:00:00Z'),
        isPaymentApproved: false,
        approvalsRequired: 1,
        approvalsGiven: 0,
        ...expectZeroStatusValues(),
      });

      expect(result[1]).toEqual({
        paymentId: 4,
        paymentDate: new Date('2024-02-05T14:00:00Z'),
        isPaymentApproved: true,
        approvalsRequired: 1,
        approvalsGiven: 1,
        ...expectZeroStatusValues(),
      });
    });
  });
});
