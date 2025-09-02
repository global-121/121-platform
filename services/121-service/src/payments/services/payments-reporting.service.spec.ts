import { TestBed } from '@automock/jest';
import { Repository } from 'typeorm';

import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { PaymentsReportingHelperService } from '@121-service/src/payments/services/payments-reporting.helper.service';
import { PaymentsReportingService } from '@121-service/src/payments/services/payments-reporting.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
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
    registrationReferenceId: referenceId,
  };
}

const mockTransactions = [
  createMockTransaction('101', 100, TransactionStatusEnum.success),
  createMockTransaction('102', 200, TransactionStatusEnum.success),
];

describe('PaymentsReportingService - getTransactions', () => {
  let service: PaymentsReportingService;
  let transactionScopedRepository: TransactionScopedRepository;
  let registrationPaginationService: RegistrationsPaginationService;
  let programRegistrationAttributeRepository: ProgramRegistrationAttributeRepository;
  let paymentsHelperService: PaymentsReportingHelperService;
  let paymentRepository: Repository<PaymentEntity>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      PaymentsReportingService,
    ).compile();

    transactionScopedRepository = unitRef.get(TransactionScopedRepository);

    service = unit;
    registrationPaginationService = unitRef.get(RegistrationsPaginationService);

    jest.spyOn(transactionScopedRepository, 'getTransactions');
    jest.spyOn(
      registrationPaginationService,
      'getRegistrationViewsChunkedByReferenceIds',
    );

    registrationPaginationService = unitRef.get(RegistrationsPaginationService);
    programRegistrationAttributeRepository = unitRef.get(
      ProgramRegistrationAttributeRepository,
    );
    paymentsHelperService = unitRef.get(PaymentsReportingHelperService);
    paymentRepository = unitRef.get('PaymentEntityRepository');

    jest.spyOn<any, any>(service, 'getTransactions');
    jest.spyOn(paymentsHelperService, 'getSelectForExport');
    jest.spyOn(programRegistrationAttributeRepository, 'getDropdownAttributes');
    jest.spyOn(
      RegistrationViewsMapper,
      'replaceDropdownValuesWithEnglishLabel',
    );
    jest.spyOn(paymentRepository, 'findOne').mockResolvedValue({});
  });

  describe('getTransactionsByPaymentId', () => {
    it('should return transactions with names', async () => {
      // Arrange
      const programId = 1;
      const paymentId = 2;

      const mockRegistrationViews = [
        { referenceId: '101', name: 'John Doe' },
        { referenceId: '102', name: 'Jane Smith' },
      ] as MappedPaginatedRegistrationDto[];

      jest
        .spyOn(transactionScopedRepository, 'getTransactions')
        .mockResolvedValue(mockTransactions);

      jest
        .spyOn(
          registrationPaginationService,
          'getRegistrationViewsChunkedByReferenceIds',
        )
        .mockResolvedValue(mockRegistrationViews);

      // Act
      const result = await service.getTransactionsByPaymentId({
        programId,
        paymentId,
      });

      // Assert
      expect(result).toEqual([
        { ...mockTransactions[0], registrationName: 'John Doe' },
        { ...mockTransactions[1], registrationName: 'Jane Smith' },
      ]);
    });

    it('should throw 404 if payment does not exist', async () => {
      // Arrange
      const programId = 1;
      const paymentId = 999;
      // Simulate paymentRepository.findOne returning undefined
      (paymentRepository.findOne as jest.Mock).mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        service.getTransactionsByPaymentId({ programId, paymentId }),
      ).rejects.toMatchSnapshot();
    });

    it('should return empty array when no transactions found', async () => {
      // Arrange
      const programId = 1;
      const paymentId = 2;

      jest
        .spyOn(transactionScopedRepository, 'getTransactions')
        .mockResolvedValue([]);

      // Act
      const result = await service.getTransactionsByPaymentId({
        programId,
        paymentId,
      });

      // Assert
      expect(transactionScopedRepository.getTransactions).toHaveBeenCalledWith({
        programId,
        paymentId,
      });
      expect(result).toEqual([]);
    });
  });

  describe('exportTransactionsUsingDateFilter', () => {
    it('should call getTransactions with correct params and return formatted fileDto', async () => {
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
      expect(paymentsHelperService.getSelectForExport).toHaveBeenCalledWith(
        programId,
      );
      expect((service as any).getTransactions).toHaveBeenCalledWith({
        programId,
        select,
        fromDate: new Date(fromDateString),
        toDate: new Date(toDateString),
      });
      expect(
        programRegistrationAttributeRepository.getDropdownAttributes,
      ).toHaveBeenCalledWith({
        programId,
        select,
      });
      expect(
        RegistrationViewsMapper.replaceDropdownValuesWithEnglishLabel,
      ).toHaveBeenCalledWith({
        rows: transactions,
        attributes: dropdownAttributes,
      });
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
});
