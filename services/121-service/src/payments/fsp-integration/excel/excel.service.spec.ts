import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionsService } from '../../../payments/transactions/transactions.service';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationViewScopedRepository } from '../../../registration/registration-scoped.repository';
import { RegistrationViewEntity } from '../../../registration/registration-view.entity';
import { RegistrationsPaginationService } from '../../../registration/services/registrations-pagination.service';
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
  const registrationViewEntity = new RegistrationViewEntity();
  registrationViewEntity.phoneNumber = phoneNumber;
  const registrations = [registrationViewEntity];

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
    const importRecord = { [matchColumn]: phoneNumber, status: 'success' };

    // Act
    const result = await excelService.findReconciliationRegistration(
      importRecord,
      registrations,
      matchColumn,
    );

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        phoneNumber: phoneNumber,
      }),
    );
  });

  it('should throw an error when import record lacks a status column', async () => {
    // Arrange
    const importRecord = { [matchColumn]: phoneNumber };

    // Act & Assert
    await expect(
      excelService.findReconciliationRegistration(
        importRecord,
        registrations,
        matchColumn,
      ),
    ).rejects.toThrow('Http Exception');
  });

  it('should return undefined (or appropriate value) when no phone number matches', async () => {
    const wrongPhoneNumber = '1234567890';
    const importRecord = { [matchColumn]: wrongPhoneNumber, status: 'success' };

    const result = await excelService.findReconciliationRegistration(
      importRecord,
      registrations,
      matchColumn,
    );

    expect(result).toBeUndefined();
  });
});
