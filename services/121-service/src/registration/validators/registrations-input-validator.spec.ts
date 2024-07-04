import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import {
  AttributeWithOptionalLabel,
  QuestionType,
} from '@121-service/src/registration/enum/custom-data-attributes';
import { RegistrationCsvValidationEnum } from '@121-service/src/registration/enum/registration-csv-validation.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationsInputValidator } from '@121-service/src/registration/validators/registrations-input-validator';
import { UserService } from '@121-service/src/user/user.service';
import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

const programId = 1;
const userId = 1;
const dynamicAttributes: AttributeWithOptionalLabel[] = [
  {
    id: 8,
    name: 'addressStreet',
    type: 'text',
    fspNames: [FinancialServiceProviderName.intersolveVisa],
    questionTypes: [QuestionType.fspQuestion],
  },
  {
    id: 9,
    name: 'addressHouseNumber',
    type: 'numeric',
    fspNames: [FinancialServiceProviderName.intersolveVisa],
    questionTypes: [QuestionType.fspQuestion],
  },
  {
    id: 10,
    name: 'addressHouseNumberAddition',
    type: 'text',
    fspNames: [FinancialServiceProviderName.intersolveVisa],
    questionTypes: [QuestionType.fspQuestion],
  },
  {
    id: 11,
    name: 'addressPostalCode',
    type: 'text',
    fspNames: [FinancialServiceProviderName.intersolveVisa],
    questionTypes: [QuestionType.fspQuestion],
  },
  {
    id: 12,
    name: 'addressCity',
    type: 'text',
    fspNames: [FinancialServiceProviderName.intersolveVisa],
    questionTypes: [QuestionType.fspQuestion],
  },
  {
    id: 13,
    name: 'whatsappPhoneNumber',
    type: 'tel',
    fspNames: [
      FinancialServiceProviderName.intersolveVisa,
      FinancialServiceProviderName.intersolveVoucherWhatsapp,
    ],
    questionTypes: [QuestionType.fspQuestion],
  },
  {
    id: 3,
    name: 'fullName',
    type: 'text',
    options: null,
    fspNames: [],
    questionTypes: [QuestionType.programQuestion],
  },
  {
    id: 4,
    name: 'phoneNumber',
    type: 'tel',
    options: null,
    fspNames: [],
    questionTypes: [QuestionType.programQuestion],
  },
  {
    id: 5,
    name: 'house',
    type: 'dropdown',
    options: [
      { option: 'lannister', label: { en: 'Lannister' } },
      { option: 'stark', label: { en: 'Stark' } },
      { option: 'greyjoy', label: { en: 'Greyjoy' } },
    ],
    fspNames: [],
    questionTypes: [QuestionType.programQuestion],
  },
];

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
          useValue: {
            lookupAndCorrect: jest.fn().mockResolvedValue('1234567890'),
          },
        },
      ],
    }).compile();

    validator = module.get<RegistrationsInputValidator>(
      RegistrationsInputValidator,
    );

    mockRegistrationRepository.findOne = jest.fn().mockResolvedValue(null);
    mockProgramRepository.findOneByOrFail = jest.fn().mockResolvedValue({
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
        fspName: FinancialServiceProviderName.intersolveVoucherWhatsapp,
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
        fspName: FinancialServiceProviderName.intersolveVoucherWhatsapp,
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
