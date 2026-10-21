import { inject, Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { unique } from 'radashi';

import { ExcelFspConfigurationResponseDto } from '@121-service/src/fsp-integrations/integrations/excel/dto/excel-fsp-configuration-response.dto';
import { fspConfigurationPropertyTypes } from '@121-service/src/fsp-integrations/shared/consts/fsp-configuration-property-types.const';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspConfigurationPropertyType } from '@121-service/src/fsp-integrations/shared/types/fsp-configuration-property.type';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';
import { sensitivePropertyString } from '@121-service/src/program-fsp-configurations/const/sensitive-property-string.const';

import {
  FspConfiguration,
  FspConfigurationPropertyInputType,
  FspFormField,
  FspFormFieldName,
} from '~/domains/fsp-configuration/fsp-configuration.model';
import { AttributeWithTranslatedLabel } from '~/domains/program/program.model';
import { TranslatableStringService } from '~/services/translatable-string.service';
import { Dto } from '~/utils/dto-type';

export type FspConfigurationFormGroup = FormGroup<
  {
    displayName: FormControl<string>;
  } & Partial<{
    columnToMatch: FormControl<string>;
    columnsToExport: FormControl<string[]>;
  }> &
    Partial<
      Record<
        FspConfigurationProperties,
        FormControl<FspConfigurationPropertyType>
      >
    >
>;

@Injectable({
  providedIn: 'root',
})
export class FspConfigurationService {
  readonly translatableStringService = inject(TranslatableStringService);

  getMissingRequiredAttributes({
    fspSetting,
    programAttributes,
  }: {
    fspSetting: FspSettingsDto;
    programAttributes: AttributeWithTranslatedLabel[];
  }) {
    const requiredAttributes = fspSetting.attributes.filter(
      (property) => property.isRequired,
    );

    const missingRequiredAttribute = requiredAttributes.filter(
      (attribute) =>
        // if this "some" returns false, it means the attribute is missing
        !programAttributes.some(
          (programAttribute) =>
            programAttribute.name === (attribute.name as string),
        ),
    );

    return missingRequiredAttribute;
  }

  fspSettingToFormGroup({
    fspSetting,
    existingFspConfiguration,
  }: {
    fspSetting: FspSettingsDto;
    existingFspConfiguration?: FspConfiguration;
  }): FspConfigurationFormGroup {
    return new FormGroup({
      displayName: new FormControl(
        this.getDisplayNameValue({ fspSetting, existingFspConfiguration }),
        {
          nonNullable: true,
          // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
          validators: [Validators.required],
        },
      ),
      ...Object.fromEntries(
        fspSetting.configurationProperties.map((property) => [
          property.name,
          new FormControl(
            this.getPropertyValue({
              propertyName: property.name,
              existingFspConfiguration,
            }),
            {
              nonNullable: true,
              // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
              validators: property.isRequired ? [Validators.required] : [],
            },
          ),
        ]),
      ),
    });
  }

  fspSettingToFspFormFields({
    fspSetting,
    existingFspConfiguration,
  }: {
    fspSetting: FspSettingsDto;
    existingFspConfiguration?: FspConfiguration;
  }): FspFormField[] {
    return [
      {
        name: 'displayName',
        isRequired: true,
        isSensitive: false,
      },
      ...fspSetting.configurationProperties.map((property) => ({
        name: property.name,
        isRequired: property.isRequired,
        isSensitive:
          existingFspConfiguration?.properties.find(
            (p) => p.name === property.name,
          )?.value === sensitivePropertyString,
      })),
    ];
  }

  getPropertyFieldType(
    propertyName: FspFormFieldName,
  ): FspConfigurationPropertyInputType {
    // Specific exceptions for excel fsp and the display name
    switch (propertyName) {
      case 'columnToMatch':
        return FspConfigurationPropertyInputType.selectAttribute;
      case 'columnsToExport':
        return FspConfigurationPropertyInputType.selectAttributeMultiple;
      case 'displayName':
        return FspConfigurationPropertyInputType.stringInput;
      default:
        return this.getPropertyFieldTypeForDefaultName(propertyName);
    }
  }

  getPropertyFieldTypeForDefaultName(
    name: FspConfigurationProperties,
  ): FspConfigurationPropertyInputType {
    const type = fspConfigurationPropertyTypes[name];
    switch (type) {
      case 'number':
        return FspConfigurationPropertyInputType.numberInput;
      case 'boolean':
        return FspConfigurationPropertyInputType.toggleSwitch;
      case 'string':
        return FspConfigurationPropertyInputType.stringInput;
      default:
        throw new Error(`Unsupported type for property: ${name}`);
    }
  }

  getRequiredFspAttributes({
    fspSetting,
    excelFspConfiguration,
  }: {
    fspSetting: FspSettingsDto;
    excelFspConfiguration?: Dto<ExcelFspConfigurationResponseDto>;
  }): string[] {
    if (fspSetting.name === Fsps.excel) {
      if (!excelFspConfiguration) {
        return [];
      }

      return unique(
        [
          ...excelFspConfiguration.exportFields,
          excelFspConfiguration.uniqueIdentifierField,
        ].filter((attributeName) => attributeName !== ''),
      );
    }

    return fspSetting.attributes
      .filter((property) => property.isRequired)
      .map((property) => property.name);
  }

  private getDisplayNameValue({
    fspSetting,
    existingFspConfiguration,
  }: {
    fspSetting: FspSettingsDto;
    existingFspConfiguration?: FspConfiguration;
  }) {
    const label = existingFspConfiguration
      ? existingFspConfiguration.label
      : fspSetting.defaultLabel;

    return this.translatableStringService.translate(label) ?? '';
  }

  private getPropertyValue({
    propertyName,
    existingFspConfiguration,
  }: {
    propertyName: FspConfigurationProperties;
    existingFspConfiguration?: FspConfiguration;
  }): FspConfigurationPropertyType {
    let existingPropertyValue = existingFspConfiguration?.properties.find(
      (p) => p.name === propertyName,
    )?.value;

    // we don't want to show the sensitive property string in the form
    // so we replace it with an empty string, forcing the user to re-enter the value
    if (existingPropertyValue === sensitivePropertyString) {
      existingPropertyValue = '';
    }

    return (
      existingPropertyValue ?? this.getDefaultValueForProperty(propertyName)
    );
  }

  private getDefaultValueForProperty(
    propertyName: FspConfigurationProperties,
  ): FspConfigurationPropertyType {
    const propType = fspConfigurationPropertyTypes[propertyName];
    switch (propType) {
      case 'boolean':
        return true;
      case 'number':
        return 0;
      case 'string':
        return '';
      default:
        throw new Error(`Unsupported type for property: ${propertyName}`);
    }
  }
}
