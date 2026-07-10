import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { FSP_MODES } from '@121-service/src/fsp-integrations/settings/fsp-env-variable-settings.const';
import { fspConfigurationPropertyTypes } from '@121-service/src/fsp-integrations/shared/consts/fsp-configuration-property-types.const';
import {
  FspConfigurationPropertyVisibility,
  FspConfigurationPropertyVisibilityMap,
} from '@121-service/src/fsp-integrations/shared/consts/fsp-configuration-property-visibility.const';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspConfigurationPropertyType } from '@121-service/src/fsp-integrations/shared/types/fsp-configuration-property.type';
import {
  getFspConfigurationProperties,
  getFspConfigurationRequiredProperties,
} from '@121-service/src/fsp-management/fsp-settings.helpers';
import { CreateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration-property.dto';
import { FspConfigurationStates } from '@121-service/src/program-fsp-configurations/enum/fsp-configuration-states.enum';

@Injectable()
export class ProgramFspConfigurationsHelperService {
  public computeFspConfigurationState({
    fspName,
    fspConfigurationProperties,
  }: {
    fspName: Fsps;
    fspConfigurationProperties: CreateProgramFspConfigurationPropertyDto[];
  }): FspConfigurationStates {
    const requiredProperties = getFspConfigurationRequiredProperties(fspName);

    if (requiredProperties.length === 0) {
      return FspConfigurationStates.configured;
    }

    const propertyNames = fspConfigurationProperties.map((p) => p.name) ?? [];
    const hasAllRequiredProperties = requiredProperties.every((required) =>
      propertyNames.includes(required),
    );

    return hasAllRequiredProperties
      ? FspConfigurationStates.configured
      : FspConfigurationStates.configurationPending;
  }

  public validatePropertyValueTypeOrThrow({
    propertyName,
    propertyValue,
  }: {
    propertyName: FspConfigurationProperties;
    propertyValue: FspConfigurationPropertyType;
  }) {
    const expectedType = fspConfigurationPropertyTypes[propertyName];
    let actualType: string = typeof propertyValue;

    // we have a special case for arrays, because typeof [] is 'object'
    if (Array.isArray(propertyValue)) {
      actualType = 'array';

      // Check if all items in the array are strings
      if (!propertyValue.every((item) => typeof item === 'string')) {
        actualType = 'non-string-array';
      }
    }

    // typeof NaN is 'number' but we want to catch it as an invalid value
    if (actualType === 'number' && Number.isNaN(propertyValue as number)) {
      actualType = 'NaN';
    }

    if (expectedType !== actualType) {
      throw new HttpException(
        `Invalid value type for property "${propertyName}". Expected ${expectedType}, got ${actualType}.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public validatePropertyValueTypesOrThrow({
    properties,
  }: {
    readonly properties: readonly {
      readonly name: FspConfigurationProperties;
      readonly value: FspConfigurationPropertyType;
    }[];
  }): void {
    for (const property of properties) {
      this.validatePropertyValueTypeOrThrow({
        propertyName: property.name,
        propertyValue: property.value,
      });
    }
  }

  public validateLabelHasEnglishTranslation({ label }: { label: any }): void {
    if (!label?.en) {
      throw new HttpException(
        `Label must have an English translation`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public validateFspIsEnabledOrThrow({
    fspName,
  }: {
    readonly fspName: Fsps;
  }): void {
    if (FSP_MODES[fspName] === FspMode.disabled) {
      throw new HttpException(
        `FSP "${fspName}" is not enabled on this instance.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public getAllowlistedPropertyNamesForFsp({
    fspName,
  }: {
    fspName: Fsps;
  }): string[] {
    const fspConfigurationProperties = getFspConfigurationProperties(fspName);
    if (
      !fspConfigurationProperties ||
      fspConfigurationProperties.length === 0
    ) {
      return [];
    }

    return fspConfigurationProperties.filter(
      (propertyName) =>
        FspConfigurationPropertyVisibilityMap[propertyName] ===
        FspConfigurationPropertyVisibility.public,
    );
  }

  public validateAllowedPropertyNames({
    propertyNames,
    fspName,
  }: {
    propertyNames: FspConfigurationProperties[];
    fspName: Fsps;
  }): void {
    const configPropertiesOfFsp = getFspConfigurationProperties(fspName);

    const errors: string[] = [];
    for (const propertyName of propertyNames) {
      if (
        configPropertiesOfFsp &&
        !configPropertiesOfFsp.includes(propertyName)
      ) {
        errors.push(
          `For fsp ${fspName}, only the following values are allowed: ${configPropertiesOfFsp.join(' ')}. You tried to add ${propertyName}.`,
        );
      }
    }

    // Check if there are duplicate property names in this array
    if (propertyNames.length !== new Set(propertyNames).size) {
      const duplicateNames = propertyNames.filter(
        (name, index) => propertyNames.indexOf(name) !== index,
      );
      errors.push(
        `Duplicate property names are not allowed. Found the following duplicates: ${duplicateNames.join(', ')}`,
      );
    }

    if (errors.length > 0) {
      const errorsString = errors.join(' ');
      throw new HttpException(errorsString, HttpStatus.BAD_REQUEST);
    }
  }
}
