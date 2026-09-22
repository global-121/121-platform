import { FspConfigurationPropertyType } from '@121-service/src/fsp-integrations/shared/types/fsp-configuration-property.type';

export function serializeFspConfigurationPropertyValue(
  value: FspConfigurationPropertyType,
): string {
  return String(value);
}
