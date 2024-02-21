import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import { TransactionsService } from '../../../payments/transactions/transactions.service';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationViewScopedRepository } from '../../../registration/registration-scoped.repository';
import { RegistrationViewEntity } from '../../../registration/registration-view.entity';
import { RegistrationsPaginationService } from '../../../registration/services/registrations-pagination.service';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { TransactionReturnDto } from '../../transactions/dto/get-transaction.dto';
import { ExcelService } from './excel.service';

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
          fspName: FspName.excel,
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
