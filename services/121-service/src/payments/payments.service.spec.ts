import { TestBed } from '@automock/jest';
import { Repository } from 'typeorm';

import { GetTransactionResponseDto } from '@121-service/src/payments/dto/get-transaction-response.dto';
import { PaymentsService } from '@121-service/src/payments/payments.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';

function createMockTransaction(
  id: number,
  amount: number,
  status: TransactionStatusEnum,
): GetTransactionResponseDto {
  return {
    id,
    created: new Date(),
    updated: new Date(),
    payment: 1,
    status,
    amount,
    errorMessage: null,
    programFinancialServiceProviderConfigurationName: 'someFsp',
    registrationProgramId: id + 100,
    registrationId: id,
    registrationStatus: RegistrationStatusEnum.included,
    registrationReferenceId: `REF-${id}`,
    registrationName: undefined,
  };
}

const mockTransactions = [
  createMockTransaction(101, 100, TransactionStatusEnum.success),
  createMockTransaction(102, 200, TransactionStatusEnum.success),
];

describe('PaymentsService - getTransactions', () => {
  let service: PaymentsService;
  let transactionScopedRepository: TransactionScopedRepository;
  let programRepository: Repository<ProgramEntity>;
  let registrationScopedRepository: RegistrationScopedRepository;

  const mockFullnameNamingConvention = ['firstName', 'lastName'];

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(PaymentsService).compile();

    transactionScopedRepository = unitRef.get(TransactionScopedRepository);
    registrationScopedRepository = unitRef.get(RegistrationScopedRepository);
    programRepository = unitRef.get('ProgramEntityRepository');
    service = unit;

    jest.spyOn(transactionScopedRepository, 'getTransactionsForPayment');
    jest.spyOn(programRepository, 'findOneOrFail');
    jest.spyOn(registrationScopedRepository, 'getFullNamesByRegistrationIds');
  });

  it('should return transactions with names when fullnameNamingConvention exists', async () => {
    // Arrange
    const programId = 1;
    const payment = 2;

    const mockRegistrationNames = [
      { registrationId: 101, name: 'John Doe' },
      { registrationId: 102, name: 'Jane Smith' },
    ];

    jest
      .spyOn(transactionScopedRepository, 'getTransactionsForPayment')
      .mockResolvedValue(mockTransactions);
    jest.spyOn(programRepository, 'findOneOrFail').mockResolvedValue({
      fullnameNamingConvention: mockFullnameNamingConvention,
    } as ProgramEntity);
    jest
      .spyOn(registrationScopedRepository, 'getFullNamesByRegistrationIds')
      .mockResolvedValue(mockRegistrationNames);

    // Act
    const result = await service.getTransactions({ programId, payment });

    // Assert
    expect(result).toEqual([
      { ...mockTransactions[0], registrationName: 'John Doe' },
      { ...mockTransactions[1], registrationName: 'Jane Smith' },
    ]);
  });

  it('should return transactions without names when fullnameNamingConvention is empty', async () => {
    // Arrange
    const programId = 1;
    const payment = 2;

    jest
      .spyOn(transactionScopedRepository, 'getTransactionsForPayment')
      .mockResolvedValue(mockTransactions);
    jest.spyOn(programRepository, 'findOneOrFail').mockResolvedValue({
      fullnameNamingConvention: [],
    } as unknown as ProgramEntity);

    // Act
    const result = await service.getTransactions({ programId, payment });

    // Assert
    expect(result).toEqual(mockTransactions);
  });

  it('should return empty array when no transactions found', async () => {
    // Arrange
    const programId = 1;
    const payment = 2;

    jest
      .spyOn(transactionScopedRepository, 'getTransactionsForPayment')
      .mockResolvedValue([]);
    jest.spyOn(programRepository, 'findOneOrFail').mockResolvedValue({
      fullnameNamingConvention: mockFullnameNamingConvention,
    } as ProgramEntity);

    // Act
    const result = await service.getTransactions({ programId, payment });

    // Assert
    expect(
      transactionScopedRepository.getTransactionsForPayment,
    ).toHaveBeenCalledWith({ programId, payment });
    expect(result).toEqual([]);
  });
});
