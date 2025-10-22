import { inject, Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { castArray, unique } from 'radashi';

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { FspDto } from '@121-service/src/fsps/fsp.dto';
import { sensitivePropertyString } from '@121-service/src/program-fsp-configurations/const/sensitive-property-string.const';

import {
  FspConfiguration,
  FspFormField,
} from '~/domains/fsp-configuration/fsp-configuration.model';
import { AttributeWithTranslatedLabel } from '~/domains/project/project.model';
import { TranslatableStringService } from '~/services/translatable-string.service';

export type FspConfigurationFormGroup = FormGroup<
  {
    displayName: FormControl<string>;
  } & Partial<
    Record<
      FspConfigurationProperties,
      FormControl<string | string[] | undefined>
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
    projectAttributes,
  }: {
    fspSetting: FspDto;
    projectAttributes: AttributeWithTranslatedLabel[];
  }) {
    const requiredAttributes = fspSetting.attributes.filter(
      (property) => property.isRequired,
    );

    const missingRequiredAttribute = requiredAttributes.filter(
      (attribute) =>
        // if this "some" returns false, it means the attribute is missing
        !projectAttributes.some(
          (projectAttribute) =>
            projectAttribute.name === attribute.name.toString(),
        ),
    );

    return missingRequiredAttribute;
  }

  fspSettingToFormGroup({
    fspSetting,
    existingFspConfiguration,
  }: {
    fspSetting: FspDto;
    existingFspConfiguration?: FspConfiguration;
  }): FspConfigurationFormGroup {
    return new FormGroup({
      displayName: new FormControl<string>(
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
          new FormControl<string | string[]>(
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
    fspSetting: FspDto;
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
    propertyName: 'displayName' | FspConfigurationProperties,
  ): 'select-attribute' | 'select-attributes-multiple' | 'string' {
    switch (propertyName) {
      case FspConfigurationProperties.columnToMatch:
        return 'select-attribute';
      case FspConfigurationProperties.columnsToExport:
        return 'select-attributes-multiple';
      default:
        return 'string';
    }
  }

  getRequiredFspAttributes({
    fspSetting,
    existingFspConfiguration,
  }: {
    fspSetting: FspDto;
    existingFspConfiguration: FspConfiguration;
  }): string[] {
    if (fspSetting.name !== Fsps.excel) {
      return fspSetting.attributes
        .filter((property) => property.isRequired)
        .map((property) => property.name);
    }

    const columnsToExport = this.getPropertyValue({
      propertyName: FspConfigurationProperties.columnsToExport,
      existingFspConfiguration,
    });

    const columnToMatch = this.getPropertyValue({
      propertyName: FspConfigurationProperties.columnToMatch,
      existingFspConfiguration,
    });

    return unique([...castArray(columnsToExport), ...castArray(columnToMatch)]);
  }

  private getDisplayNameValue({
    fspSetting,
    existingFspConfiguration,
  }: {
    fspSetting: FspDto;
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
  }): string | string[] {
    let existingPropertyValue = existingFspConfiguration?.properties.find(
      (p) => p.name === propertyName,
    )?.value;

    // we don't want to show the sensitive property string in the form
    // so we replace it with an empty string, forcing the user to re-enter the value
    if (existingPropertyValue === sensitivePropertyString) {
      existingPropertyValue = '';
    }

    const fieldType = this.getPropertyFieldType(propertyName);
    if (fieldType === 'select-attributes-multiple') {
      // we need to default these properties it to an empty array instead of an empty string
      existingPropertyValue = existingPropertyValue ?? [];
    }

    return existingPropertyValue ?? '';
  }
}
