export function parseFspConfigurationPropertyValue({
  value,
  type,
}: {
  value: string | string[];
  type: string | string[] | number | boolean;
}): string | string[] | number | boolean {
  //we expect arrays to contain strings only
  if (Array.isArray(value) || type === 'string') {
    return value;
  }

  if (type === 'number') {
    return parseNumber(value);
  }

  if (type === 'boolean') {
    return parseBoolean(value);
  }

  throw new Error(`Unsupported FSP configuration property type: ${type}`);
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
