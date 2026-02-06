import { FspConfigurationPropertyType } from '@121-service/src/fsp-integrations/shared/types/fsp-configuration-property.type';

export function serializeFspConfigurationPropertyValue(
  value: FspConfigurationPropertyType,
): string | string[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'boolean') {
    return value.toString();
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`Cannot serialize value "${value}" as number`);
    }
    return value.toString();
  }

  throw new Error('Unsupported FSP configuration property value type');
}
