import { ActivityInfoEnumItemDto } from '@121-service/src/activityinfo/dtos/activityinfo-api/activityinfo-enum-item.dto';
import { ActivityInfoFormFieldDto } from '@121-service/src/activityinfo/dtos/activityinfo-api/activityinfo-form-field.dto';
import { ActivityInfoFormSchemaDto } from '@121-service/src/activityinfo/dtos/activityinfo-api/activityinfo-form-schema.dto';
import {
  ActivityInfoEnumeratedCardinality,
  ActivityInfoFieldType,
} from '@121-service/src/activityinfo/enum/activityinfo-field-type';
import { ActivityInfoChoiceCleaned } from '@121-service/src/activityinfo/interfaces/activityinfo-choice-cleaned.interface';
import { ActivityInfoFieldCleaned } from '@121-service/src/activityinfo/interfaces/activityinfo-field-cleaned.interface';
import { ActivityInfoFormDefinition } from '@121-service/src/activityinfo/interfaces/activityinfo-form-definition.interface';

export class ActivityInfoFormDefinitionMapper {
  public static formSchemaDtoToFormDefinition({
    formSchema,
  }: {
    formSchema: ActivityInfoFormSchemaDto;
  }): ActivityInfoFormDefinition {
    return {
      formId: formSchema.id,
      name: formSchema.label ?? '',
      fields: this.formFieldDtosToFieldsCleaned({
        formFields: formSchema.elements ?? [],
      }),
      language: formSchema.language,
      schemaVersion: String(formSchema.schemaVersion),
    };
  }

  private static formFieldDtosToFieldsCleaned({
    formFields,
  }: {
    formFields: ActivityInfoFormFieldDto[];
  }): ActivityInfoFieldCleaned[] {
    return formFields.map((formField) => ({
      id: formField.id,
      code: formField.code,
      label: formField.label ?? '',
      type: formField.type as ActivityInfoFieldType,
      cardinality: this.parseCardinality({ formField }),
      choices: this.enumItemDtosToChoicesCleaned({
        enumItems: formField.typeParameters?.values ?? [],
      }),
    }));
  }

  private static parseCardinality({
    formField,
  }: {
    formField: ActivityInfoFormFieldDto;
  }): ActivityInfoEnumeratedCardinality | undefined {
    const { cardinality } = formField.typeParameters ?? {};
    if (!cardinality) {
      return;
    }

    // ActivityInfo serializes cardinality lowercased, but normalize defensively
    // so an unexpected casing does not silently fall through to a dropdown.
    const normalizedCardinality = cardinality.toLowerCase();
    if (normalizedCardinality === ActivityInfoEnumeratedCardinality.multiple) {
      return ActivityInfoEnumeratedCardinality.multiple;
    }
    if (normalizedCardinality === ActivityInfoEnumeratedCardinality.single) {
      return ActivityInfoEnumeratedCardinality.single;
    }
    return;
  }

  private static enumItemDtosToChoicesCleaned({
    enumItems,
  }: {
    enumItems: ActivityInfoEnumItemDto[];
  }): ActivityInfoChoiceCleaned[] {
    return enumItems.map((enumItem) => ({
      id: enumItem.id,
      label: enumItem.label ?? '',
      code: enumItem.code,
    }));
  }
}
