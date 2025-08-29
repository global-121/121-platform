import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { ProjectRegistrationAttributeEntity } from '@121-service/src/projects/project-registration-attribute.entity';
import {
  DefaultRegistrationDataAttributeNames,
  GenericRegistrationAttributes,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationValidationInputType } from '@121-service/src/registration/enum/registration-validation-input-type.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { RegistrationsInputValidator } from '@121-service/src/registration/validators/registrations-input-validator';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { UserService } from '@121-service/src/user/user.service';

const projectId = 1;
const userId = 1;
const dynamicAttributes: Partial<ProjectRegistrationAttributeEntity>[] = [
  {
    id: 8,
    name: FspAttributes.addressStreet,
    type: RegistrationAttributeTypes.text,
    isRequired: false,
  },
  {
    id: 9,
    name: FspAttributes.addressHouseNumber,
    type: RegistrationAttributeTypes.numeric,
    isRequired: false,
  },
  {
    id: 10,
    name: FspAttributes.addressHouseNumberAddition,
    type: RegistrationAttributeTypes.text,
    isRequired: false,
  },
  {
    id: 11,
    name: FspAttributes.addressPostalCode,
    type: RegistrationAttributeTypes.text,
    isRequired: false,
  },
  {
    id: 12,
    name: FspAttributes.addressCity,
    type: RegistrationAttributeTypes.text,
    isRequired: false,
  },
  {
    id: 13,
    name: FspAttributes.whatsappPhoneNumber,
    type: RegistrationAttributeTypes.tel,
    isRequired: false,
  },
  {
    id: 3,
    name: FspAttributes.fullName,
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

const project = {
  id: 1,
  name: 'Test Project',
  languages: ['en'],
  enableMaxPayments: true,
  enableScope: true,
  projectFspConfigurations: [
    {
      fspName: Fsps.intersolveVoucherWhatsapp,
      name: 'Intersolve-voucher-whatsapp',
    },
    {
      fspName: Fsps.excel,
      name: 'Excel',
    },
  ],
  projectRegistrationAttributes: dynamicAttributes,
};

describe('RegistrationsInputValidator', () => {
  let validator: RegistrationsInputValidator;
  let mockProjectRepository: Partial<Repository<ProjectEntity>>;
  let mockRegistrationRepository: Partial<Repository<RegistrationEntity>>;
  let userService: UserService;
  let registrationsPaginationService: RegistrationsPaginationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockProjectRepository = {};
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
          provide: getRepositoryToken(ProjectEntity),
          useValue: mockProjectRepository,
        },
        {
          provide: getRepositoryToken(RegistrationEntity),
          useValue: mockRegistrationRepository,
        },
        {
          provide: UserService,
          useValue: {
            getUserScopeForProject: jest.fn().mockResolvedValue('country'),
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
            getRegistrationViewsChunkedByReferenceIds: jest
              .fn()
              .mockResolvedValue([]),
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

    userService = module.get<UserService>(UserService);
    mockRegistrationRepository.findOne = jest.fn().mockResolvedValue(null);
    mockProjectRepository.findOneOrFail = jest.fn().mockResolvedValue(project);
    registrationsPaginationService = module.get<RegistrationsPaginationService>(
      RegistrationsPaginationService,
    );
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
        projectFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
        scope: 'country',
        house: 'stark',
      },
    ];

    const result = await validator.validateAndCleanInput({
      registrationInputArray: csvArray,
      projectId,
      userId,
      typeOfInput: RegistrationValidationInputType.create,
      validationConfig: {
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
      'projectFspConfigurationName',
      Fsps.intersolveVoucherWhatsapp,
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
        projectFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
        scope: 'country',
      },
    ];

    await expect(
      validator.validateAndCleanInput({
        registrationInputArray: csvArray,
        projectId,
        userId,
        typeOfInput: RegistrationValidationInputType.create,
        validationConfig: {
          validateUniqueReferenceId: true,
          validateExistingReferenceId: true,
        },
      }),
    ).rejects.toThrow(HttpException);
  });

  it('should report errors for rows missing mandatory fields on import', async () => {
    const csvArray = [
      {
        projectFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
        preferredLanguage: 'en',
      },
    ];
    const projectId = 1;
    const userId = 1;

    await expect(
      validator.validateAndCleanInput({
        registrationInputArray: csvArray,
        projectId,
        userId,
        typeOfInput: RegistrationValidationInputType.create,
        validationConfig: {
          validateUniqueReferenceId: true,
          validateExistingReferenceId: true,
        },
      }),
    ).rejects.toThrow(HttpException);
  });

  it('should not report errors for rows missing mandatory fields on bulk update', async () => {
    const csvArray = [
      {
        projectFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
        preferredLanguage: 'en',
      },
    ];

    await expect(
      validator.validateAndCleanInput({
        registrationInputArray: csvArray,
        projectId,
        userId,
        typeOfInput: RegistrationValidationInputType.update,
        validationConfig: {
          validateExistingReferenceId: false,
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
        projectFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
        whatsappPhoneNumber: '1234567890',
        scope: 'country',
      },
    ];

    await expect(
      validator.validateAndCleanInput({
        registrationInputArray: csvArray,
        projectId,
        userId,
        typeOfInput: RegistrationValidationInputType.create,
        validationConfig: {
          validateExistingReferenceId: true,
          validateUniqueReferenceId: true,
        },
      }),
    ).rejects.toHaveProperty('response', [
      {
        lineNumber: 1,
        column: GenericRegistrationAttributes.phoneNumber,
        value: undefined,
        error:
          'PhoneNumber is required when creating a new registration for this project. Set allowEmptyPhoneNumber to true in the project settings to allow empty phone numbers',
      },
    ]);
  });

  it('should add max payment when its null', async () => {
    const csvArray = [
      {
        maxPayments: null,
      },
    ];

    const result = await validator.validateAndCleanInput({
      registrationInputArray: csvArray,
      projectId,
      userId,
      typeOfInput: RegistrationValidationInputType.update,
      validationConfig: {
        validateExistingReferenceId: true,
        validateUniqueReferenceId: true,
      },
    });

    expect(result[0]).toHaveProperty('maxPayments');
  });

  // When columns are left empty in a csv they are read as empty string
  // This can happen we creating registrations with a csv file
  it('should be able to post all non required attributes as empty string', async () => {
    jest.spyOn(userService, 'getUserScopeForProject').mockResolvedValue('');
    const projectAllowsEmptyPhoneNumber = {
      ...project,
      allowEmptyPhoneNumber: true,
    };
    mockProjectRepository.findOneOrFail = jest
      .fn()
      .mockResolvedValue(projectAllowsEmptyPhoneNumber);

    const csvArray = [
      {
        preferredLanguage: 'en',
        paymentAmountMultiplier: '1',
        lastName: '',
        phoneNumber: '',
        whatsappPhoneNumber: '',
        addressStreet: '',
        addressHouseNumber: '',
        addressHouseNumberAddition: '',
        projectFspConfigurationName: Fsps.excel,
        scope: '',
        house: '',
      },
    ];

    const result = await validator.validateAndCleanInput({
      registrationInputArray: csvArray,
      projectId,
      userId,
      typeOfInput: RegistrationValidationInputType.create,
      validationConfig: {
        validateUniqueReferenceId: true,
        validateExistingReferenceId: true,
      },
    });

    const expected = {
      data: {
        addressStreet: null,
        addressHouseNumber: null,
        addressHouseNumberAddition: null,
        whatsappPhoneNumber: null,
        phoneNumber: null,
        house: null,
      },
      paymentAmountMultiplier: 1,
      scope: '',
      preferredLanguage: 'en',
      phoneNumber: null,
      projectFspConfigurationName: 'Excel',
    };

    expect(result[0]).toEqual(expected);
  });

  it('should only return the value you try to validate', async () => {
    const fullName = 'testName';
    const csvArray = [
      {
        fullName,
      },
    ];
    const result = await validator.validateAndCleanInput({
      registrationInputArray: csvArray,
      projectId,
      userId,
      typeOfInput: RegistrationValidationInputType.update,
      validationConfig: {
        validateUniqueReferenceId: true,
        validateExistingReferenceId: true,
      },
    });
    const expectedResult = {
      data: {
        fullName,
      },
    };
    expect(result[0]).toEqual(expectedResult);
  });

  it('should reject bulk updates containing telephone attributes', async () => {
    const referenceId = '00dc9451-1273-484c-b2e8-ae21b51a96ab';
    const mockRegistration = {
      referenceId,
      projectFspConfigurationName: 'Excel',
    } as unknown as RegistrationViewEntity;

    jest
      .spyOn(
        registrationsPaginationService,
        'getRegistrationViewsChunkedByReferenceIds',
      )
      .mockResolvedValueOnce([mockRegistration]);

    const csvArray = [
      {
        referenceId,
        phoneNumber: '14155238880',
        whatsappPhoneNumber: '14155238880',
      },
    ];

    const validationPromise = validator.validateAndCleanInput({
      registrationInputArray: csvArray,
      projectId,
      userId,
      typeOfInput: RegistrationValidationInputType.bulkUpdate,
      validationConfig: {
        validateUniqueReferenceId: true,
        validateExistingReferenceId: true,
      },
    });

    await expect(validationPromise).rejects.toThrow(HttpException);
    await expect(validationPromise).rejects.toMatchObject({
      response: expect.arrayContaining([
        {
          lineNumber: 1,
          column: DefaultRegistrationDataAttributeNames.phoneNumber,
          value: '14155238880',
          error: `Attribute ${DefaultRegistrationDataAttributeNames.phoneNumber} is of type tel (telephone number) and cannot be updated in bulk`,
        },
        {
          lineNumber: 1,
          column: FspAttributes.whatsappPhoneNumber,
          value: '14155238880',
          error: `Attribute ${FspAttributes.whatsappPhoneNumber} is of type tel (telephone number) and cannot be updated in bulk`,
        },
      ]),
    });
  });
});
