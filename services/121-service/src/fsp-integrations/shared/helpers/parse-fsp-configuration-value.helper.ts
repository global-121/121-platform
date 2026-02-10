import { FspConfigurationDto } from '@121-service/src/fsp-integrations/shared/dto/fsp-configuration-property-types.dto';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { FspConfigurationPropertyType } from '@121-service/src/fsp-integrations/shared/types/fsp-configuration-property.type';

export function parseFspConfigurationPropertyValue({
  name,
  value,
}: {
  name: FspConfigurationProperties;
  value: string;
}): FspConfigurationPropertyType {
  const parser = getParser(name);
  if (parser) {
    return parser(value);
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

const getParser = (name) => {
  if (typeof FspConfigurationDto[name] === 'boolean') {
    return parseBoolean;
  }
  if (typeof FspConfigurationDto[name] === 'number') {
    return parseNumber;
  }
  return null;
};

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
