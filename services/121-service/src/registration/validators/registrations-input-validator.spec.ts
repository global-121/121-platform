import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import {
  AttributeWithOptionalLabel,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationCsvValidationEnum } from '@121-service/src/registration/enum/registration-csv-validation.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationsInputValidator } from '@121-service/src/registration/validators/registrations-input-validator';
import { UserService } from '@121-service/src/user/user.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';

const programId = 1;
const userId = 1;
const dynamicAttributes: AttributeWithOptionalLabel[] = [
  {
    id: 8,
    name: 'addressStreet',
    type: RegistrationAttributeTypes.text,
    isRequired: false,
  },
  {
    id: 9,
    name: 'addressHouseNumber',
    type: RegistrationAttributeTypes.numeric,
    isRequired: false,
  },
  {
    id: 10,
    name: 'addressHouseNumberAddition',
    type: RegistrationAttributeTypes.text,
    isRequired: false,
  },
  {
    id: 11,
    name: 'addressPostalCode',
    type: RegistrationAttributeTypes.text,
    isRequired: false,
  },
  {
    id: 12,
    name: 'addressCity',
    type: RegistrationAttributeTypes.text,
    isRequired: false,
  },
  {
    id: 13,
    name: 'whatsappPhoneNumber',
    type: RegistrationAttributeTypes.tel,
    isRequired: false,
  },
  {
    id: 3,
    name: 'fullName',
    type: RegistrationAttributeTypes.text,
    options: null,
    isRequired: false,
  },
  {
    id: 4,
    name: 'phoneNumber',
    type: RegistrationAttributeTypes.tel,
    options: null,
    isRequired: false,
  },
  {
    id: 5,
    name: 'house',
    type: RegistrationAttributeTypes.dropdown,
    options: [
      { option: 'lannister', label: { en: 'Lannister' } },
      { option: 'stark', label: { en: 'Stark' } },
      { option: 'greyjoy', label: { en: 'Greyjoy' } },
    ],
    isRequired: false,
  },
];

describe('RegistrationsInputValidator', () => {
  let validator: RegistrationsInputValidator;
  let mockProgramRepository: Partial<Repository<ProgramEntity>>;
  let mockRegistrationRepository: Partial<Repository<RegistrationEntity>>;

  beforeEach(async () => {
    mockProgramRepository = {};
    mockRegistrationRepository = {};

    const mockRegistrationViewScopedRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
      }),
      // other methods...
    };
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
          useValue: {
            lookupAndCorrect: jest.fn().mockResolvedValue('1234567890'),
          },
        },
        {
          provide: RegistrationsPaginationService,
          useValue: {
            getRegistrationsChunked: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: RegistrationViewScopedRepository,
          useValue: mockRegistrationViewScopedRepository,
        },
      ],
    }).compile();

    validator = module.get<RegistrationsInputValidator>(
      RegistrationsInputValidator,
    );

    mockRegistrationRepository.findOne = jest.fn().mockResolvedValue(null);
    mockProgramRepository.findOneOrFail = jest.fn().mockResolvedValue({
      id: 1,
      name: 'Test Program',
      languages: ['en'],
      programFinancialServiceProviderConfigurations: [
        {
          financialServiceProviderName:
            FinancialServiceProviders.intersolveVoucherWhatsapp,
          name: 'Intersolve-voucher-whatsapp',
        },
      ],
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
        programFinancialServiceProviderConfigurationName:
          FinancialServiceProviders.intersolveVoucherWhatsapp,
        scope: 'country',
        house: 'stark',
      },
    ];

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
      'programFinancialServiceProviderConfigurationName',
      FinancialServiceProviders.intersolveVoucherWhatsapp,
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
        programFinancialServiceProviderConfigurationName:
          FinancialServiceProviders.intersolveVoucherWhatsapp,
        scope: 'country',
      },
    ];

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

  it('should report errors for rows missing mandatory fields on import', async () => {
    const csvArray = [
      {
        programFinancialServiceProviderConfigurationName:
          FinancialServiceProviders.intersolveVoucherWhatsapp,
        preferredLanguage: 'en',
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

  it('should not report errors for rows missing mandatory fields on bulk update', async () => {
    const csvArray = [
      {
        programFinancialServiceProviderConfigurationName:
          FinancialServiceProviders.intersolveVoucherWhatsapp,
        preferredLanguage: 'en',
      },
    ];

    await expect(
      validator.validateAndCleanRegistrationsInput(
        csvArray,
        programId,
        userId,
        dynamicAttributes,
        RegistrationCsvValidationEnum.bulkUpdate,
      ),
    ).rejects.toThrow(HttpException);
  });
});
