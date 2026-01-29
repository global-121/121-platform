export function serializeFspConfigurationValue(
  value: string | string[] | number | boolean,
  type: 'string' | 'string[]' | 'number' | 'boolean',
): string {
  switch (type) {
    case 'string':
      return value as string;
    case 'string[]':
      return (value as string[]).join(', ');
    case 'number':
      return (value as number).toString();
    case 'boolean':
      return (value as boolean) ? 'true' : 'false';
    default:
      throw new Error(`Unsupported type: ${type}`);
  }
}
