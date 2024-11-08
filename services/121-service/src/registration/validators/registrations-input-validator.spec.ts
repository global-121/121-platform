import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FinancialServiceProviderAttributes } from '@121-service/src/financial-service-providers/enum/financial-service-provider-attributes.enum';
import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import {
  DefaultRegistrationDataAttributeNames,
  GenericRegistrationAttributes,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationValidationInputType } from '@121-service/src/registration/enum/registration-validation-input-type.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { RegistrationsInputValidator } from '@121-service/src/registration/validators/registrations-input-validator';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { UserService } from '@121-service/src/user/user.service';

const programId = 1;
const userId = 1;
const dynamicAttributes: Partial<ProgramRegistrationAttributeEntity>[] = [
  {
    id: 8,
    name: FinancialServiceProviderAttributes.addressStreet,
    type: RegistrationAttributeTypes.text,
    isRequired: false,
  },
  {
    id: 9,
    name: FinancialServiceProviderAttributes.addressHouseNumber,
    type: RegistrationAttributeTypes.numeric,
    isRequired: false,
  },
  {
    id: 10,
    name: FinancialServiceProviderAttributes.addressHouseNumberAddition,
    type: RegistrationAttributeTypes.text,
    isRequired: false,
  },
  {
    id: 11,
    name: FinancialServiceProviderAttributes.addressPostalCode,
    type: RegistrationAttributeTypes.text,
    isRequired: false,
  },
  {
    id: 12,
    name: FinancialServiceProviderAttributes.addressCity,
    type: RegistrationAttributeTypes.text,
    isRequired: false,
  },
  {
    id: 13,
    name: FinancialServiceProviderAttributes.whatsappPhoneNumber,
    type: RegistrationAttributeTypes.tel,
    isRequired: false,
  },
  {
    id: 3,
    name: FinancialServiceProviderAttributes.fullName,
    type: RegistrationAttributeTypes.text,
    options: null,
    isRequired: false,
  },
  {
    id: 4,
    name: DefaultRegistrationDataAttributeNames.phoneNumber,
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
      programRegistrationAttributes: dynamicAttributes,
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

    const result = await validator.validateAndCleanInput({
      registrationInputArray: csvArray,
      programId,
      userId,
      typeOfInput: RegistrationValidationInputType.create,
      validationConfig: {
        validatePhoneNumberLookup: true,
        validateUniqueReferenceId: true,
        validateExistingReferenceId: true,
      },
    });

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
      validator.validateAndCleanInput({
        registrationInputArray: csvArray,
        programId,
        userId,
        typeOfInput: RegistrationValidationInputType.create,
        validationConfig: {
          validatePhoneNumberLookup: true,
          validateUniqueReferenceId: true,
          validateExistingReferenceId: true,
        },
      }),
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

    await expect(
      validator.validateAndCleanInput({
        registrationInputArray: csvArray,
        programId,
        userId,
        typeOfInput: RegistrationValidationInputType.create,
        validationConfig: {
          validatePhoneNumberLookup: true,
          validateUniqueReferenceId: true,
          validateExistingReferenceId: true,
        },
      }),
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
      validator.validateAndCleanInput({
        registrationInputArray: csvArray,
        programId,
        userId,
        typeOfInput: RegistrationValidationInputType.update,
        validationConfig: {
          validateExistingReferenceId: false,
          validatePhoneNumberLookup: false,
          validateUniqueReferenceId: false,
        },
      }),
    ).rejects.toThrow(HttpException);
  });

  it('should report errors for a missing phonenumber when it is not allowed', async () => {
    const csvArray = [
      {
        namePartnerOrganization: 'ABC',
        preferredLanguage: LanguageEnum.en,
        maxPayments: '5',
        nameFirst: 'Test',
        nameLast: 'Test',
        programFinancialServiceProviderConfigurationName:
          FinancialServiceProviders.intersolveVoucherWhatsapp,
        whatsappPhoneNumber: '1234567890',
        scope: 'country',
      },
    ];

    await expect(
      validator.validateAndCleanInput({
        registrationInputArray: csvArray,
        programId,
        userId,
        typeOfInput: RegistrationValidationInputType.create,
        validationConfig: {
          validateExistingReferenceId: true,
          validatePhoneNumberLookup: true,
          validateUniqueReferenceId: true,
        },
      }),
    ).rejects.toHaveProperty('response', [
      {
        lineNumber: 1,
        column: GenericRegistrationAttributes.phoneNumber,
        value: undefined,
        error:
          'PhoneNumber is required when creating a new registration for this program. Set allowEmptyPhoneNumber to true in the program settings to allow empty phone numbers',
      },
    ]);
  });
});
