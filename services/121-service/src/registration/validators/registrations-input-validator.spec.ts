import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialServiceProviderName } from '../../financial-service-provider/enum/financial-service-provider-name.enum';
import { LookupService } from '../../notifications/lookup/lookup.service';
import { ProgramEntity } from '../../programs/program.entity';
import { UserService } from '../../user/user.service';
import { RegistrationCsvValidationEnum } from '../enum/registration-csv-validation.enum';
import { RegistrationEntity } from '../registration.entity';
import { RegistrationsInputValidator } from './registrations-input-validator';

describe('RegistrationsInputValidator', () => {
  let validator: RegistrationsInputValidator;
  let mockProgramRepository: Partial<Repository<ProgramEntity>>;
  let mockRegistrationRepository: Partial<Repository<RegistrationEntity>>;

  beforeEach(async () => {
    mockProgramRepository = {};
    mockRegistrationRepository = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationsInputValidator,
        {
          provide: getRepositoryToken(ProgramEntity),
          useValue: mockProgramRepository,
        },
        {
          provide: getRepositoryToken(RegistrationEntity),
          useValue: mockRegistrationRepository,
        },
        {
          provide: UserService,
          useValue: {
            getUserScopeForProgram: jest.fn().mockResolvedValue('country'),
          },
        },
        {
          provide: LookupService,
          useValue: {},
        },
      ],
    }).compile();

    validator = module.get<RegistrationsInputValidator>(
      RegistrationsInputValidator,
    );

    mockRegistrationRepository.findOne = jest.fn().mockResolvedValue(null);
    mockProgramRepository.findOneBy = jest.fn().mockResolvedValue({
      id: 1,
      name: 'Test Program',
      languages: ['en'],
    });
  });

  it('should validate and clean registrations input without errors', async () => {
    const csvArray = [
      {
        referenceId: '00dc9451-1273-484c-b2e8-ae21b51a96ab',
        preferredLanguage: 'en',
        paymentAmountMultiplier: 2,
        lastName: 'Updated Last Name',
        phoneNumber: '14155238880',
        whatsappPhoneNumber: '14155238880',
        addressStreet: 'newStreet1',
        addressHouseNumber: '2',
        addressHouseNumberAddition: 'Ground',
        fspName: FinancialServiceProviderName.intersolveVoucherWhatsapp,
        scope: 'country',
      },
    ];
    const programId = 1;
    const userId = 1;
    const dynamicAttributes = [];

    const result = await validator.validateAndCleanRegistrationsInput(
      csvArray,
      programId,
      userId,
      dynamicAttributes,
      RegistrationCsvValidationEnum.importAsRegistered,
    );

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty(
      'referenceId',
      '00dc9451-1273-484c-b2e8-ae21b51a96ab',
    );
    expect(result[0]).toHaveProperty(
      'fspName',
      FinancialServiceProviderName.intersolveVoucherWhatsapp,
    );
    expect(result[0]).toHaveProperty('paymentAmountMultiplier', 2);
    expect(result[0]).toHaveProperty('preferredLanguage', 'en');
  });

  it('should throw an error for invalid reference ID format', async () => {
    const csvArray = [
      {
        referenceId: '!@#$',
        preferredLanguage: 'en',
        paymentAmountMultiplier: 2,
        lastName: 'Updated Last Name',
        phoneNumber: '14155238880',
        whatsappPhoneNumber: '14155238880',
        addressStreet: 'newStreet1',
        addressHouseNumber: '2',
        addressHouseNumberAddition: 'Ground',
        fspName: FinancialServiceProviderName.intersolveVoucherWhatsapp,
        scope: 'country',
      },
    ];
    const programId = 1;
    const userId = 1;
    const dynamicAttributes = [];

    await expect(
      validator.validateAndCleanRegistrationsInput(
        csvArray,
        programId,
        userId,
        dynamicAttributes,
        RegistrationCsvValidationEnum.importAsRegistered,
      ),
    ).rejects.toThrow(HttpException);
  });

  it('should report errors for rows missing mandatory fields', async () => {
    const csvArray = [
      { fspName: FinancialServiceProviderName.intersolveVoucherWhatsapp, preferredLanguage: 'en' },
    ];
    const programId = 1;
    const userId = 1;
    const dynamicAttributes = [];

    await expect(
      validator.validateAndCleanRegistrationsInput(
        csvArray,
        programId,
        userId,
        dynamicAttributes,
        RegistrationCsvValidationEnum.importAsRegistered,
      ),
    ).rejects.toThrow(HttpException);
  });
});
