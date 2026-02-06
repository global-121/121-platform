import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { FspConfigurationPropertyType } from '@121-service/src/fsp-integrations/shared/types/fsp-configuration-property.type';

export const typeMap: Partial<
  Record<FspConfigurationProperties, (value: string) => boolean | number>
> = {
  [FspConfigurationProperties.cardDistributionByMail]: (value) =>
    parseBoolean(value),
  [FspConfigurationProperties.maxToSpendPerMonthInCents]: (value) =>
    parseNumber(value),
};

export function parseFspConfigurationPropertyValue({
  name,
  value,
}: {
  name: FspConfigurationProperties;
  value: string | string[];
}): FspConfigurationPropertyType {
  if (Array.isArray(value)) {
    return value;
  }

  const parser = typeMap[name];
  if (parser) {
    return parser(value);
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
