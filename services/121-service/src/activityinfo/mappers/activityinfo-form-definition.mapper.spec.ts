import { ActivityInfoFormFieldDto } from '@121-service/src/activityinfo/dtos/activityinfo-api/activityinfo-form-field.dto';
import { ActivityInfoFormSchemaDto } from '@121-service/src/activityinfo/dtos/activityinfo-api/activityinfo-form-schema.dto';
import {
  ActivityInfoEnumeratedCardinality,
  ActivityInfoFieldType,
} from '@121-service/src/activityinfo/enum/activityinfo-field-type';
import { ActivityInfoFormDefinitionMapper } from '@121-service/src/activityinfo/mappers/activityinfo-form-definition.mapper';

describe('ActivityInfoFormDefinitionMapper', () => {
  const createFormField = (
    overrides: Partial<ActivityInfoFormFieldDto> = {},
  ): ActivityInfoFormFieldDto => ({
    id: 'cfieldid000000001',
    code: 'defaultCode',
    label: 'Default label',
    type: ActivityInfoFieldType.freeText,
    required: false,
    ...overrides,
  });

  const createFormSchema = (
    overrides: Partial<ActivityInfoFormSchemaDto> = {},
  ): ActivityInfoFormSchemaDto => ({
    id: 'cqlnfvvmel72a2ka',
    label: 'Household registration',
    schemaVersion: 12,
    databaseId: 'cdatabaseid000001',
    elements: [],
    ...overrides,
  });

  describe('formSchemaDtoToFormDefinition', () => {
    it('maps the form identity and stringifies a numeric schema version', () => {
      const formSchema = createFormSchema({ schemaVersion: 12 });

      const formDefinition =
        ActivityInfoFormDefinitionMapper.formSchemaDtoToFormDefinition({
          formSchema,
        });

      expect(formDefinition.formId).toBe('cqlnfvvmel72a2ka');
      expect(formDefinition.name).toBe('Household registration');
      expect(formDefinition.schemaVersion).toBe('12');
    });

    it('keeps an already-stringified schema version unchanged', () => {
      const formSchema = createFormSchema({ schemaVersion: '13' });

      const formDefinition =
        ActivityInfoFormDefinitionMapper.formSchemaDtoToFormDefinition({
          formSchema,
        });

      expect(formDefinition.schemaVersion).toBe('13');
    });

    it('falls back to an empty name when the form has no label', () => {
      const formSchema = createFormSchema({
        label: undefined as unknown as string,
      });

      const formDefinition =
        ActivityInfoFormDefinitionMapper.formSchemaDtoToFormDefinition({
          formSchema,
        });

      expect(formDefinition.name).toBe('');
    });

    it('maps an empty field list when the schema has no elements', () => {
      const formSchema = createFormSchema({ elements: undefined });

      const formDefinition =
        ActivityInfoFormDefinitionMapper.formSchemaDtoToFormDefinition({
          formSchema,
        });

      expect(formDefinition.fields).toEqual([]);
    });

    it('carries over the field id, code and label', () => {
      const formSchema = createFormSchema({
        elements: [
          createFormField({
            id: 'cphonefieldid0001',
            code: 'phoneNumber',
            label: 'Phone number',
          }),
        ],
      });

      const formDefinition =
        ActivityInfoFormDefinitionMapper.formSchemaDtoToFormDefinition({
          formSchema,
        });

      expect(formDefinition.fields[0]).toMatchObject({
        id: 'cphonefieldid0001',
        code: 'phoneNumber',
        label: 'Phone number',
        type: ActivityInfoFieldType.freeText,
      });
    });

    it('leaves the code undefined when the field has none', () => {
      const formSchema = createFormSchema({
        elements: [createFormField({ code: undefined })],
      });

      const formDefinition =
        ActivityInfoFormDefinitionMapper.formSchemaDtoToFormDefinition({
          formSchema,
        });

      expect(formDefinition.fields[0].code).toBeUndefined();
    });

    it('falls back to an empty label when the field has none', () => {
      const formSchema = createFormSchema({
        elements: [createFormField({ label: undefined as unknown as string })],
      });

      const formDefinition =
        ActivityInfoFormDefinitionMapper.formSchemaDtoToFormDefinition({
          formSchema,
        });

      expect(formDefinition.fields[0].label).toBe('');
    });

    it('maps the choices of an enumerated field', () => {
      const formSchema = createFormSchema({
        elements: [
          createFormField({
            type: ActivityInfoFieldType.enumerated,
            typeParameters: {
              cardinality: 'single',
              presentation: 'dropdown',
              values: [
                { id: 'cchoice1', label: 'Yes', code: 'yes' },
                { id: 'cchoice2', label: 'No' },
              ],
            },
          }),
        ],
      });

      const formDefinition =
        ActivityInfoFormDefinitionMapper.formSchemaDtoToFormDefinition({
          formSchema,
        });

      expect(formDefinition.fields[0].choices).toEqual([
        { id: 'cchoice1', label: 'Yes', code: 'yes' },
        { id: 'cchoice2', label: 'No', code: undefined },
      ]);
    });

    it('falls back to an empty choice label when a value has none', () => {
      const formSchema = createFormSchema({
        elements: [
          createFormField({
            type: ActivityInfoFieldType.enumerated,
            typeParameters: {
              values: [{ id: 'cchoice1' } as unknown as { id: string; label: string }],
            },
          }),
        ],
      });

      const formDefinition =
        ActivityInfoFormDefinitionMapper.formSchemaDtoToFormDefinition({
          formSchema,
        });

      expect(formDefinition.fields[0].choices[0].label).toBe('');
    });

    it('maps an empty choice list for a field without type parameters', () => {
      const formSchema = createFormSchema({
        elements: [createFormField({ typeParameters: undefined })],
      });

      const formDefinition =
        ActivityInfoFormDefinitionMapper.formSchemaDtoToFormDefinition({
          formSchema,
        });

      expect(formDefinition.fields[0].choices).toEqual([]);
    });

    describe('cardinality', () => {
      it.each([
        ['single', ActivityInfoEnumeratedCardinality.single],
        ['multiple', ActivityInfoEnumeratedCardinality.multiple],
        ['SINGLE', ActivityInfoEnumeratedCardinality.single],
        ['MULTIPLE', ActivityInfoEnumeratedCardinality.multiple],
      ])('maps "%s" to %s', (rawCardinality, expectedCardinality) => {
        const formSchema = createFormSchema({
          elements: [
            createFormField({
              type: ActivityInfoFieldType.enumerated,
              typeParameters: { cardinality: rawCardinality },
            }),
          ],
        });

        const formDefinition =
          ActivityInfoFormDefinitionMapper.formSchemaDtoToFormDefinition({
            formSchema,
          });

        expect(formDefinition.fields[0].cardinality).toBe(expectedCardinality);
      });

      it('is undefined when the field declares none', () => {
        const formSchema = createFormSchema({
          elements: [createFormField({ typeParameters: {} })],
        });

        const formDefinition =
          ActivityInfoFormDefinitionMapper.formSchemaDtoToFormDefinition({
            formSchema,
          });

        expect(formDefinition.fields[0].cardinality).toBeUndefined();
      });

      it('is undefined when the value is not recognized', () => {
        const formSchema = createFormSchema({
          elements: [
            createFormField({ typeParameters: { cardinality: 'triple' } }),
          ],
        });

        const formDefinition =
          ActivityInfoFormDefinitionMapper.formSchemaDtoToFormDefinition({
            formSchema,
          });

        expect(formDefinition.fields[0].cardinality).toBeUndefined();
      });
    });

    it('carries over the declared form language', () => {
      const formSchema = createFormSchema({ language: 'en' });

      const formDefinition =
        ActivityInfoFormDefinitionMapper.formSchemaDtoToFormDefinition({
          formSchema,
        });

      expect(formDefinition.language).toBe('en');
    });
  });
});
