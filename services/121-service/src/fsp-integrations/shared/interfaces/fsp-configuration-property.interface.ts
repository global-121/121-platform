import { FspConfigurationPropertyType } from '@121-service/src/fsp-integrations/shared/types/fsp-configuration-property.type';

export interface FspConfigurationProperty {
  name: string;
  value: FspConfigurationPropertyType;
}
