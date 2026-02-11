import { fspConfigurationPropertyTypes } from '@121-service/src/fsp-integrations/shared/consts/fsp-configuration-property-types.const';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { FspConfigurationPropertyType } from '@121-service/src/fsp-integrations/shared/types/fsp-configuration-property.type';

export function parseFspConfigurationPropertyValue({
  name,
  value,
}: {
  name: FspConfigurationProperties;
  value: string;
}): FspConfigurationPropertyType {
  const propType = fspConfigurationPropertyTypes[name];

  if (propType === 'number') {
    return parseNumber(value);
  }

  if (propType === 'boolean') {
    return parseBoolean(value);
  }

  try {
    const parsedValue = JSON.parse(value);
    if (Array.isArray(parsedValue)) {
      return parsedValue;
    }

    return value;
  } catch (error) {
    return value;
  }
}

const parseNumber = (value: string): number => {
  const parsedNumber = Number(value);

  if (isNaN(parsedNumber) || value.trim() === '') {
    throw new Error(`Cannot parse value "${value}" as number`);
  }

  return parsedNumber;
};

const parseBoolean = (value: string): boolean => {
  const lowerCaseValue = value.toLowerCase();

  if (lowerCaseValue !== 'true' && lowerCaseValue !== 'false') {
    throw new Error(`Cannot parse value "${value}" as boolean`);
  }

  return lowerCaseValue === 'true';
};
