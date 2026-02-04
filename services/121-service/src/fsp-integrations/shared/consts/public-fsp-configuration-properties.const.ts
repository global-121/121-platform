import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';

export const PublicFspConfigurationProperties: Partial<
  Record<Fsps, FspConfigurationProperties[]>
> = {
  [Fsps.intersolveVisa]: [FspConfigurationProperties.cardDistributionByMail],
};
