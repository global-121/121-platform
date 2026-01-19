import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';

export const PublicFspConfigurationPropertiesByFsp: Readonly<
  Partial<Record<Fsps, readonly FspConfigurationProperties[]>>
> = {
  [Fsps.intersolveVisa]: [FspConfigurationProperties.cardDistributionByMail],
};
