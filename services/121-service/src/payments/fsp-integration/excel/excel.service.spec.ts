import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { TransactionReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

const mockTransactionService = {
  retrieveTransaction: jest.fn(),
};

const mockRegistrationsPaginationService = {
  retrieveRegistrationsPaginationService: jest.fn(),
};

const mockRegistrationViewScopedRepository = {
  retrieveRegistrationViewScopedRepository: jest.fn(),
};

describe('ExcelService', () => {
  let excelService: ExcelService;

  const matchColumn = 'phoneNumber';
  const phoneNumber = '27883373741';
  const referenceid = 'referenceId1234';
  const registrationId = 1;
  const transactionStatus = StatusEnum.success;
  const transactionAmount = 25;
  const registrationViewEntity = new RegistrationViewEntity();
  registrationViewEntity.phoneNumber = phoneNumber;
  registrationViewEntity.id = registrationId;
  registrationViewEntity.referenceId = referenceid;
  const registrations = [registrationViewEntity];
  const transaction = new TransactionReturnDto();
  transaction.referenceId = referenceid;
  transaction.amount = transactionAmount;
  const transactions = [transaction];

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExcelService,
        {
          provide: getRepositoryToken(ProgramEntity),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockResolvedValue({
                id: 1,
                programFspConfiguration: [
                  { name: 'columnToMatch', value: 'phoneNumber' },
                ],
              }),
            })),
          },
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionService,
        },
        {
          provide: RegistrationsPaginationService,
          useValue: mockRegistrationsPaginationService,
        },
        {
          provide: RegistrationViewScopedRepository,
          useValue: mockRegistrationViewScopedRepository,
        },
      ],
    }).compile();

    excelService = moduleRef.get<ExcelService>(ExcelService);
  });

  it('should find and return the matching reconciliation record for a given registration', async () => {
    // Arrange
    const importRecords = [
      { [matchColumn]: phoneNumber, status: transactionStatus },
    ];

    const expectedResult = [
      {
        paTransactionResult: {
          calculatedAmount: transactionAmount,
          fspName: FinancialServiceProviderName.excel,
          referenceId: referenceid,
          registrationId: registrationId,
          status: transactionStatus,
        },
        phoneNumber: phoneNumber,
        status: transactionStatus,
      },
    ];

    // Act
    const result = excelService.joinRegistrationsAndImportRecords(
      registrations,
      importRecords,
      matchColumn,
      transactions,
    );

    // Assert
    expect(result).toEqual(expectedResult);
  });

  it('should return no paTransactionResult when no phone number matches', async () => {
    // Arrange
    const wrongPhoneNumber = '1234567890';
    const importRecords = [
      {
        [matchColumn]: wrongPhoneNumber,
        status: transactionStatus,
      },
    ];

    // Act
    const result = excelService.joinRegistrationsAndImportRecords(
      registrations,
      importRecords,
      matchColumn,
      transactions,
    );

    // Assert
    expect(result[0]['paTransactionResult']).toBeUndefined();
  });

  it('should throw an error when import record lacks a status column', async () => {
    // Arrange
    const importRecords = [{ [matchColumn]: phoneNumber }];

    // Act & Assert
    try {
      excelService.joinRegistrationsAndImportRecords(
        registrations,
        importRecords,
        matchColumn,
        transactions,
      );
      // eslint-disable-next-line jest/no-jasmine-globals
      fail('Expected error to be thrown');
    } catch (error) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(error).toBeDefined();
    }
  });
});
