import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';

export type ParsedFspConfigurationProperties = Partial<
  Record<FspConfigurationProperties, any>
>;
