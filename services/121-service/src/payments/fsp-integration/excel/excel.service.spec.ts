import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionsService } from '../../../payments/transactions/transactions.service';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationViewScopedRepository } from '../../../registration/registration-scoped.repository';
import { RegistrationEntity } from '../../../registration/registration.entity'; // Adjust the import path as necessary
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
    const importRecords = { phoneNumber: '27883373741', status: 'success' };

    const registrationEntity = new RegistrationEntity();
    registrationEntity.phoneNumber = '27883373741';

    jest
      .spyOn(registrationEntity, 'getRegistrationDataValueByName')
      .mockResolvedValue('27883373741');
    const registrations = [registrationEntity];
    const result = await excelService.findReconciliationRegistration(
      importRecords,
      registrations,
      'phoneNumber',
    );

    expect(result).toEqual(
      expect.objectContaining({
        phoneNumber: '27883373741',
      }),
    );
    expect(
      registrationEntity.getRegistrationDataValueByName,
    ).not.toHaveBeenCalled();
  });

  it('should throw an error when import record lacks a status column', async () => {
    const importRecords = [{ phoneNumber: '27883373741' }];

    const registrationEntity = new RegistrationEntity();
    registrationEntity.phoneNumber = '27883373741';

    jest
      .spyOn(registrationEntity, 'getRegistrationDataValueByName')
      .mockResolvedValue('27883373741');

    await expect(
      excelService.findReconciliationRegistration(
        importRecords,
        [registrationEntity],
        'phoneNumber',
      ),
    ).rejects.toThrow('Http Exception');

    expect(
      registrationEntity.getRegistrationDataValueByName,
    ).not.toHaveBeenCalled();
  });

  it('should return undefined (or appropriate value) when no phone number matches', async () => {
    const importRecords = { phoneNumber: '1234567890', status: 'success' };

    const registrationEntity = new RegistrationEntity();
    registrationEntity.phoneNumber = '27883373741';

    const result = await excelService.findReconciliationRegistration(
      importRecords,
      [registrationEntity],
      'phoneNumber',
    );

    expect(result).toBeUndefined();
  });
});
