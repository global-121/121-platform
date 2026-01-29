export function parseFspConfigurationValue(
  value: string,
  type: 'string' | 'string[]' | 'number' | 'boolean',
): string | string[] | number | boolean {
  switch (type) {
    case 'string':
      return value;
    case 'string[]':
      return value.split(',').map((item) => item.trim());
    case 'number':
      return Number(value);
    case 'boolean':
      return value.toLowerCase() === 'true';
    default:
      throw new Error(`Unsupported type: ${type}`);
  }
}
