import { FspConfigurationPropertyType } from '@121-service/src/fsp-integrations/shared/types/fsp-configuration-property.type';

export function serializeFspConfigurationPropertyValue(
  value: FspConfigurationPropertyType,
): string {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  return String(value);
}
