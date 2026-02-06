import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { FspConfigurationPropertyType } from '@121-service/src/fsp-integrations/shared/types/fsp-configuration-property.type';

export type ParsedFspConfigurationProperties = Partial<
  Record<FspConfigurationProperties, FspConfigurationPropertyType>
>;
