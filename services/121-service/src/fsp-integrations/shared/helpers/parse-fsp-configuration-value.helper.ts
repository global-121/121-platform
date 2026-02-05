import { FspConfigurationPropertyTypes } from '@121-service/src/fsp-integrations/shared/consts/fsp-configuration-property-types.const';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';

export function parseFspConfigurationPropertyValue({
  name,
  value,
}: {
  name: FspConfigurationProperties;
  value: string | string[];
}): string | number | boolean | string[] {
  const type = FspConfigurationPropertyTypes[name];

  if (!Array.isArray(value)) {
    if (type === 'number') {
      return parseNumber(value);
    }

    if (type === 'boolean') {
      return parseBoolean(value);
    }
  }

  return value;
}

const parseNumber = (value: string): number => {
  const parsedNumber = Number(value);

  if (isNaN(parsedNumber)) {
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
