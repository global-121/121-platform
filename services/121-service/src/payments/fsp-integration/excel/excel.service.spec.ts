import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { randomSort } from '@121-service/src/utils/random-value.helper';

describe('ExcelService', () => {
  let service: ExcelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExcelService,
        {
          provide: getRepositoryToken(ProgramEntity),
          useClass: Repository,
        },
        {
          provide: RegistrationsPaginationService,
          useValue: {
            getRegistrationViewsByReferenceIds: jest.fn(),
          },
        },
        {
          provide: ProgramFspConfigurationRepository,
          useValue: {
            getPropertyValueByName: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExcelService>(ExcelService);
  });

  describe('joinRegistrationsAndTransactions', () => {
    /**
     * Generate a registration with the index as the referenceId.
     */
    const generateRegistrations = (count: number) => {
      const registrations: MappedPaginatedRegistrationDto[] = [];
      for (let index = 1; index <= count; index++) {
        const registration = new RegistrationViewEntity();
        registration.referenceId = index.toString();
        registrations.push(registration);
      }
      return registrations;
    };

    /**
     * Generate a transaction with the index as the referenceId.
     * The transferValue is index * 10.
     */
    const generateTransactions = (count: number) => {
      const transactions: TransactionEntity[] = [];
      for (let index = 1; index <= count; index++) {
        const transaction = new TransactionEntity();
        transaction.registration = {
          referenceId: index.toString(),
        } as RegistrationEntity;
        transaction.transferValue = index * 10;
        transactions.push(transaction);
      }
      return transactions;
    };

    it('should join registrations and transactions correctly', () => {
      const registrations = generateRegistrations(9);
      const transactions = generateTransactions(9);
      // Randomize the order for both because they may come in any order.
      // FYI: There is a very small chance that they are randomly sorted in the
      // same order.
      registrations.sort(randomSort);
      transactions.sort(randomSort);
      const exportColumns = [];

      const result = service.joinRegistrationsAndTransactions(
        registrations,
        transactions,
        exportColumns,
      );

      expect(result).toEqual([
        { referenceId: '1', amount: 10 },
        { referenceId: '2', amount: 20 },
        { referenceId: '3', amount: 30 },
        { referenceId: '4', amount: 40 },
        { referenceId: '5', amount: 50 },
        { referenceId: '6', amount: 60 },
        { referenceId: '7', amount: 70 },
        { referenceId: '8', amount: 80 },
        { referenceId: '9', amount: 90 },
      ]);
    });

    it('should throw an error if transactions and registrations lengths do not match', () => {
      const registrations = generateRegistrations(4);
      const transactions = generateTransactions(5);

      expect(() =>
        service.joinRegistrationsAndTransactions(
          registrations,
          transactions,
          [],
        ),
      ).toThrow(
        new Error(
          `Number of transactions (${transactions.length}) and registrations (${registrations.length}) do not match`,
        ),
      );
    });
  });
});
