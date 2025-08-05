import { TestBed } from '@automock/jest';
import { Repository } from 'typeorm';

import { PaymentsHelperService } from '@121-service/src/payments/services/payments.helper.service';
import { PaymentsService } from '@121-service/src/payments/services/payments.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
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
    payment: 1,
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

describe('PaymentsService - getTransactions', () => {
  let service: PaymentsService;
  let transactionScopedRepository: TransactionScopedRepository;
  let programRepository: Repository<ProgramEntity>;
  let registrationPaginationService: RegistrationsPaginationService;
  let programRegistrationAttributeRepository: ProgramRegistrationAttributeRepository;
  let paymentsHelperService: PaymentsHelperService;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(PaymentsService).compile();

    transactionScopedRepository = unitRef.get(TransactionScopedRepository);
    programRepository = unitRef.get('ProgramEntityRepository');
    service = unit;
    registrationPaginationService = unitRef.get(RegistrationsPaginationService);

    jest.spyOn(transactionScopedRepository, 'getTransactions');
    jest.spyOn(programRepository, 'findOneOrFail');
    jest.spyOn(
      registrationPaginationService,
      'getRegistrationViewsChunkedByReferenceIds',
    );

    registrationPaginationService = unitRef.get(RegistrationsPaginationService);
    programRegistrationAttributeRepository = unitRef.get(
      ProgramRegistrationAttributeRepository,
    );
    paymentsHelperService = unitRef.get(PaymentsHelperService);

    jest.spyOn<any, any>(service, 'getTransactions');
    jest.spyOn(paymentsHelperService, 'getSelectForExport');
    jest.spyOn(programRegistrationAttributeRepository, 'getDropdownAttributes');
    jest.spyOn(
      RegistrationViewsMapper,
      'replaceDropdownValuesWithEnglishLabel',
    );
  });

  describe('geTransactionsByPaymentId', () => {
    it('should return transactions with names', async () => {
      // Arrange
      const programId = 1;
      const payment = 2;

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
      const result = await service.geTransactionsByPaymentId({
        programId,
        payment,
      });

      // Assert
      expect(result).toEqual([
        { ...mockTransactions[0], registrationName: 'John Doe' },
        { ...mockTransactions[1], registrationName: 'Jane Smith' },
      ]);
    });

    it('should return empty array when no transactions found', async () => {
      // Arrange
      const programId = 1;
      const payment = 2;

      jest
        .spyOn(transactionScopedRepository, 'getTransactions')
        .mockResolvedValue([]);

      // Act
      const result = await service.geTransactionsByPaymentId({
        programId,
        payment,
      });

      // Assert
      expect(transactionScopedRepository.getTransactions).toHaveBeenCalledWith({
        programId,
        payment,
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
});
