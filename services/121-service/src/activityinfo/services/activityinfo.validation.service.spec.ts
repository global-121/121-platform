import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import {
  ActivityInfoEnumeratedCardinality,
  ActivityInfoFieldType,
} from '@121-service/src/activityinfo/enum/activityinfo-field-type';
import { ActivityInfoValidationErrorType } from '@121-service/src/activityinfo/enum/activityinfo-validation-error-type';
import { ActivityInfoFieldCleaned } from '@121-service/src/activityinfo/interfaces/activityinfo-field-cleaned.interface';
import { ActivityInfoFormDefinition } from '@121-service/src/activityinfo/interfaces/activityinfo-form-definition.interface';
import { ActivityInfoValidationError } from '@121-service/src/activityinfo/interfaces/activityinfo-validation-error.interface';
import { ActivityInfoValidationService } from '@121-service/src/activityinfo/services/activityinfo.validation.service';
import { env } from '@121-service/src/env';
import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { TwilioMode } from '@121-service/src/notifications/enum/twilio-mode.enum';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';

jest.mock('@121-service/src/env', () => ({
  env: {
    ...jest.requireActual('@121-service/src/env').env,
    TWILIO_MODE: 'DISABLED',
  },
}));

const mockEnv = env as unknown as { TWILIO_MODE: string };

describe('ActivityInfoValidationService', () => {
  let service: ActivityInfoValidationService;
  let programFspConfigurationRepository: ProgramFspConfigurationRepository;
  let programRepository: ProgramRepository;

  const programId = 1;

  const mockFspConfigs = [
    { fspName: Fsps.safaricom, name: 'Safaricom Kenya' },
    { fspName: Fsps.intersolveVoucherWhatsapp, name: 'Intersolve WhatsApp' },
  ];

  const createField = (
    overrides: Partial<ActivityInfoFieldCleaned> = {},
  ): ActivityInfoFieldCleaned => ({
    id: `cfield${Math.random().toString(36).slice(2, 10)}`,
    code: 'someField',
    label: 'Some field',
    type: ActivityInfoFieldType.freeText,
    choices: [],
    ...overrides,
  });

  const fspField = createField({
    id: 'cfspfieldid000001',
    code: 'fsp',
    label: 'Financial Service Provider',
    type: ActivityInfoFieldType.enumerated,
    cardinality: ActivityInfoEnumeratedCardinality.single,
    choices: [
      { id: 'cchoice1', label: 'Safaricom Kenya' },
      { id: 'cchoice2', label: 'Intersolve WhatsApp' },
    ],
  });

  // A calculated fsp field carries no choices, so it can be used in scenarios
  // that deliberately configure no Fsp configurations to match choices against.
  const calculatedFspField = createField({
    id: 'cfspcalcfieldid01',
    code: 'fsp',
    label: 'Financial Service Provider',
    type: ActivityInfoFieldType.calculated,
  });

  const fspAttributeFields = [
    createField({ code: FspAttributes.phoneNumber, label: 'Phone number' }),
    createField({ code: FspAttributes.fullName, label: 'Full name' }),
    createField({
      code: FspAttributes.whatsappPhoneNumber,
      label: 'WhatsApp phone number',
    }),
    createField({ code: FspAttributes.nationalId, label: 'National ID' }),
  ];

  const createFormDefinition = (
    overrides: Partial<ActivityInfoFormDefinition> = {},
  ): ActivityInfoFormDefinition => ({
    formId: 'cqlnfvvmel72a2ka',
    name: 'Household registration',
    fields: [fspField, ...fspAttributeFields],
    schemaVersion: '12',
    ...overrides,
  });

  const validate = (formDefinition: ActivityInfoFormDefinition) =>
    service.validateActivityInfoFormDefinition({ formDefinition, programId });

  const collectErrors = async (
    formDefinition: ActivityInfoFormDefinition,
  ): Promise<ActivityInfoValidationError[]> => {
    try {
      await validate(formDefinition);
    } catch (error) {
      return (error as HttpException).getResponse()['errors'];
    }
    return [];
  };

  beforeEach(async () => {
    mockEnv.TWILIO_MODE = TwilioMode.disabled;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityInfoValidationService,
        {
          provide: ProgramFspConfigurationRepository,
          useValue: { find: jest.fn() },
        },
        {
          provide: ProgramRepository,
          useValue: {
            findOneOrFail: jest.fn().mockResolvedValue({
              fullnameNamingConvention: [],
              enableScope: false,
            }),
          },
        },
      ],
    }).compile();

    service = module.get(ActivityInfoValidationService);
    programFspConfigurationRepository = module.get(
      ProgramFspConfigurationRepository,
    );
    programRepository = module.get(ProgramRepository);

    jest
      .spyOn(programFspConfigurationRepository, 'find')
      .mockResolvedValue(mockFspConfigs as never);
  });

  it('passes for a valid form definition', async () => {
    await expect(validate(createFormDefinition())).resolves.toBeUndefined();
  });

  describe('Fsp attributes', () => {
    it('reports a missing Fsp attribute', async () => {
      const formDefinition = createFormDefinition({
        fields: [
          fspField,
          ...fspAttributeFields.filter(
            (field) => field.code !== FspAttributes.nationalId,
          ),
        ],
      });

      const errors = await collectErrors(formDefinition);

      expect(errors).toContainEqual(
        expect.objectContaining({
          type: ActivityInfoValidationErrorType.missingField,
          attributeName: FspAttributes.nationalId,
        }),
      );
    });

    it('reports an Fsp attribute with the wrong type', async () => {
      const formDefinition = createFormDefinition({
        fields: [
          fspField,
          ...fspAttributeFields.filter(
            (field) => field.code !== FspAttributes.nationalId,
          ),
          createField({
            code: FspAttributes.nationalId,
            type: ActivityInfoFieldType.quantity,
          }),
        ],
      });

      const errors = await collectErrors(formDefinition);

      expect(errors).toContainEqual(
        expect.objectContaining({
          type: ActivityInfoValidationErrorType.typeMismatch,
          attributeName: FspAttributes.nationalId,
        }),
      );
    });

    it('accepts a calculated field for any Fsp attribute type', async () => {
      const formDefinition = createFormDefinition({
        fields: [
          fspField,
          ...fspAttributeFields.filter(
            (field) => field.code !== FspAttributes.nationalId,
          ),
          createField({
            code: FspAttributes.nationalId,
            type: ActivityInfoFieldType.calculated,
          }),
        ],
      });

      await expect(validate(formDefinition)).resolves.toBeUndefined();
    });
  });

  describe('field codes', () => {
    it('reports a mappable field without a code', async () => {
      const formDefinition = createFormDefinition({
        fields: [
          fspField,
          ...fspAttributeFields,
          createField({ code: undefined, label: 'Unnamed field' }),
        ],
      });

      const errors = await collectErrors(formDefinition);

      expect(errors).toContainEqual(
        expect.objectContaining({
          type: ActivityInfoValidationErrorType.missingFieldCode,
          attributeName: 'Unnamed field',
        }),
      );
    });

    it('accepts a layout element without a code', async () => {
      const formDefinition = createFormDefinition({
        fields: [
          fspField,
          ...fspAttributeFields,
          createField({ code: undefined, type: ActivityInfoFieldType.section }),
        ],
      });

      await expect(validate(formDefinition)).resolves.toBeUndefined();
    });

    it('reports duplicate field codes', async () => {
      const formDefinition = createFormDefinition({
        fields: [
          fspField,
          ...fspAttributeFields,
          createField({ code: 'duplicated' }),
          createField({ code: 'duplicated' }),
        ],
      });

      const errors = await collectErrors(formDefinition);

      expect(errors).toContainEqual(
        expect.objectContaining({
          type: ActivityInfoValidationErrorType.invalidChoice,
          attributeName: 'duplicated',
        }),
      );
    });
  });

  describe('form language', () => {
    it('accepts a form that declares no language', async () => {
      await expect(
        validate(createFormDefinition({ language: undefined })),
      ).resolves.toBeUndefined();
    });

    it('accepts an English form', async () => {
      await expect(
        validate(createFormDefinition({ language: 'en' })),
      ).resolves.toBeUndefined();
    });

    it('accepts a regional English variant', async () => {
      await expect(
        validate(createFormDefinition({ language: 'en-GB' })),
      ).resolves.toBeUndefined();
    });

    it('reports a non-English form language', async () => {
      const errors = await collectErrors(
        createFormDefinition({ language: 'fr' }),
      );

      expect(errors).toContainEqual(
        expect.objectContaining({
          type: ActivityInfoValidationErrorType.unsupportedLanguage,
          attributeName: 'language',
        }),
      );
    });
  });

  describe('phoneNumber', () => {
    it('reports a missing phoneNumber when Twilio is enabled', async () => {
      mockEnv.TWILIO_MODE = TwilioMode.mock;
      jest
        .spyOn(programFspConfigurationRepository, 'find')
        .mockResolvedValue([] as never);

      const errors = await collectErrors(
        createFormDefinition({ fields: [calculatedFspField] }),
      );

      expect(errors).toContainEqual(
        expect.objectContaining({
          type: ActivityInfoValidationErrorType.missingField,
          attributeName: FspAttributes.phoneNumber,
        }),
      );
    });

    it('allows a missing phoneNumber when Twilio is disabled', async () => {
      jest
        .spyOn(programFspConfigurationRepository, 'find')
        .mockResolvedValue([] as never);

      await expect(
        validate(createFormDefinition({ fields: [calculatedFspField] })),
      ).resolves.toBeUndefined();
    });

    it('reports a phoneNumber that is not a text field', async () => {
      const formDefinition = createFormDefinition({
        fields: [
          fspField,
          ...fspAttributeFields.filter(
            (field) => field.code !== FspAttributes.phoneNumber,
          ),
          createField({
            code: FspAttributes.phoneNumber,
            type: ActivityInfoFieldType.quantity,
          }),
        ],
      });

      const errors = await collectErrors(formDefinition);

      expect(errors).toContainEqual(
        expect.objectContaining({
          type: ActivityInfoValidationErrorType.typeMismatch,
          attributeName: FspAttributes.phoneNumber,
        }),
      );
    });
  });

  describe('scope', () => {
    it('reports a missing scope field when scope is enabled', async () => {
      jest.spyOn(programRepository, 'findOneOrFail').mockResolvedValue({
        fullnameNamingConvention: [],
        enableScope: true,
      } as never);

      const errors = await collectErrors(createFormDefinition());

      expect(errors).toContainEqual(
        expect.objectContaining({
          type: ActivityInfoValidationErrorType.missingField,
          attributeName: GenericRegistrationAttributes.scope,
        }),
      );
    });

    it('accepts a text scope field when scope is enabled', async () => {
      jest.spyOn(programRepository, 'findOneOrFail').mockResolvedValue({
        fullnameNamingConvention: [],
        enableScope: true,
      } as never);

      const formDefinition = createFormDefinition({
        fields: [
          fspField,
          ...fspAttributeFields,
          createField({ code: GenericRegistrationAttributes.scope }),
        ],
      });

      await expect(validate(formDefinition)).resolves.toBeUndefined();
    });

    it('reports a scope field with the wrong type', async () => {
      jest.spyOn(programRepository, 'findOneOrFail').mockResolvedValue({
        fullnameNamingConvention: [],
        enableScope: true,
      } as never);

      const formDefinition = createFormDefinition({
        fields: [
          fspField,
          ...fspAttributeFields,
          createField({
            code: GenericRegistrationAttributes.scope,
            type: ActivityInfoFieldType.quantity,
          }),
        ],
      });

      const errors = await collectErrors(formDefinition);

      expect(errors).toContainEqual(
        expect.objectContaining({
          type: ActivityInfoValidationErrorType.typeMismatch,
          attributeName: GenericRegistrationAttributes.scope,
        }),
      );
    });
  });

  describe('fullname naming convention', () => {
    it('reports a missing fullname attribute', async () => {
      jest.spyOn(programRepository, 'findOneOrFail').mockResolvedValue({
        fullnameNamingConvention: ['firstName'],
        enableScope: false,
      } as never);

      const errors = await collectErrors(createFormDefinition());

      expect(errors).toContainEqual(
        expect.objectContaining({
          type: ActivityInfoValidationErrorType.missingFullnameAttributes,
          attributeName: 'firstName',
        }),
      );
    });
  });

  describe('subforms', () => {
    it('reports a subform field', async () => {
      const formDefinition = createFormDefinition({
        fields: [
          fspField,
          ...fspAttributeFields,
          createField({
            code: 'children',
            type: ActivityInfoFieldType.subForm,
          }),
        ],
      });

      const errors = await collectErrors(formDefinition);

      expect(errors).toContainEqual(
        expect.objectContaining({
          type: ActivityInfoValidationErrorType.subFormFound,
          attributeName: 'children',
        }),
      );
    });
  });

  describe('reserved attribute names', () => {
    it('reports a field using a forbidden registration view attribute', async () => {
      const formDefinition = createFormDefinition({
        fields: [
          fspField,
          ...fspAttributeFields,
          createField({ code: GenericRegistrationAttributes.status }),
        ],
      });

      const errors = await collectErrors(formDefinition);

      expect(errors).toContainEqual(
        expect.objectContaining({
          type: ActivityInfoValidationErrorType.forbiddenAttribute,
          attributeName: GenericRegistrationAttributes.status,
        }),
      );
    });

    it('accepts an allowed registration view attribute with the right type', async () => {
      const formDefinition = createFormDefinition({
        fields: [
          fspField,
          ...fspAttributeFields,
          createField({
            code: GenericRegistrationAttributes.maxPayments,
            type: ActivityInfoFieldType.quantity,
          }),
        ],
      });

      await expect(validate(formDefinition)).resolves.toBeUndefined();
    });

    it('reports an allowed registration view attribute with the wrong type', async () => {
      const formDefinition = createFormDefinition({
        fields: [
          fspField,
          ...fspAttributeFields,
          createField({
            code: GenericRegistrationAttributes.maxPayments,
            type: ActivityInfoFieldType.freeText,
          }),
        ],
      });

      const errors = await collectErrors(formDefinition);

      expect(errors).toContainEqual(
        expect.objectContaining({
          type: ActivityInfoValidationErrorType.typeMismatch,
          attributeName: GenericRegistrationAttributes.maxPayments,
        }),
      );
    });
  });

  describe('fsp field', () => {
    it('reports a missing fsp field', async () => {
      const formDefinition = createFormDefinition({
        fields: fspAttributeFields,
      });

      const errors = await collectErrors(formDefinition);

      expect(errors).toContainEqual(
        expect.objectContaining({
          type: ActivityInfoValidationErrorType.missingField,
          attributeName: 'fsp',
        }),
      );
    });

    it('reports an fsp field with an incompatible type', async () => {
      const formDefinition = createFormDefinition({
        fields: [
          createField({ code: 'fsp', type: ActivityInfoFieldType.quantity }),
          ...fspAttributeFields,
        ],
      });

      const errors = await collectErrors(formDefinition);

      expect(errors).toContainEqual(
        expect.objectContaining({
          type: ActivityInfoValidationErrorType.typeMismatch,
          attributeName: 'fsp',
        }),
      );
    });

    it('reports an fsp field whose choices do not match the Fsp configurations', async () => {
      const formDefinition = createFormDefinition({
        fields: [
          createField({
            code: 'fsp',
            type: ActivityInfoFieldType.enumerated,
            cardinality: ActivityInfoEnumeratedCardinality.single,
            choices: [{ id: 'cchoice1', label: 'Some other provider' }],
          }),
          ...fspAttributeFields,
        ],
      });

      const errors = await collectErrors(formDefinition);

      expect(errors).toContainEqual(
        expect.objectContaining({
          type: ActivityInfoValidationErrorType.invalidChoice,
          attributeName: 'fsp',
        }),
      );
    });

    it('matches an fsp choice by its code when it has one', async () => {
      const formDefinition = createFormDefinition({
        fields: [
          createField({
            code: 'fsp',
            type: ActivityInfoFieldType.enumerated,
            cardinality: ActivityInfoEnumeratedCardinality.single,
            choices: [
              {
                id: 'cchoice1',
                label: 'Anything at all',
                code: 'Safaricom Kenya',
              },
            ],
          }),
          ...fspAttributeFields,
        ],
      });

      await expect(validate(formDefinition)).resolves.toBeUndefined();
    });

    it('accepts a calculated fsp field', async () => {
      const formDefinition = createFormDefinition({
        fields: [
          createField({ code: 'fsp', type: ActivityInfoFieldType.calculated }),
          ...fspAttributeFields,
        ],
      });

      await expect(validate(formDefinition)).resolves.toBeUndefined();
    });

    it('reports a multi-select fsp field', async () => {
      const formDefinition = createFormDefinition({
        fields: [
          createField({
            code: 'fsp',
            type: ActivityInfoFieldType.enumerated,
            cardinality: ActivityInfoEnumeratedCardinality.multiple,
            choices: [{ id: 'cchoice1', label: 'Safaricom Kenya' }],
          }),
          ...fspAttributeFields,
        ],
      });

      const errors = await collectErrors(formDefinition);

      expect(errors).toContainEqual(
        expect.objectContaining({
          type: ActivityInfoValidationErrorType.typeMismatch,
          attributeName: 'fsp',
        }),
      );
    });
  });

  describe('select fields', () => {
    it('reports an enumerated field without choices', async () => {
      const formDefinition = createFormDefinition({
        fields: [
          fspField,
          ...fspAttributeFields,
          createField({
            code: 'district',
            type: ActivityInfoFieldType.enumerated,
            cardinality: ActivityInfoEnumeratedCardinality.single,
            choices: [],
          }),
        ],
      });

      const errors = await collectErrors(formDefinition);

      expect(errors).toContainEqual(
        expect.objectContaining({
          type: ActivityInfoValidationErrorType.singleSelectNoChoices,
          attributeName: 'district',
        }),
      );
    });
  });

  it('reports every problem at once rather than stopping at the first', async () => {
    const formDefinition = createFormDefinition({
      fields: [createField({ code: undefined, label: 'Unnamed field' })],
      language: 'fr',
    });

    const errors = await collectErrors(formDefinition);

    const errorTypes = new Set(errors.map((error) => error.type));
    expect(errorTypes.has(ActivityInfoValidationErrorType.missingField)).toBe(
      true,
    );
    expect(
      errorTypes.has(ActivityInfoValidationErrorType.unsupportedLanguage),
    ).toBe(true);
    expect(
      errorTypes.has(ActivityInfoValidationErrorType.missingFieldCode),
    ).toBe(true);
  });
});
