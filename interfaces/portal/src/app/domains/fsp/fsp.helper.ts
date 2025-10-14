import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';

export const getFspSettingByName = (name: Fsps) =>
  // XXX: remove this
  FSP_SETTINGS[name];

export const FSP_CONFIGURATION_PROPERTY_LABELS: Record<
  FspConfigurationProperties,
  string
> = {
  [FspConfigurationProperties.password]: $localize`Password`,
  [FspConfigurationProperties.username]: $localize`Username`,
  [FspConfigurationProperties.columnsToExport]: $localize`Columns to export`,
  [FspConfigurationProperties.columnToMatch]: $localize`Column to match`,
  [FspConfigurationProperties.brandCode]: $localize`Brand code`,
  [FspConfigurationProperties.coverLetterCode]: $localize`Cover letter code`,
  [FspConfigurationProperties.fundingTokenCode]: $localize`Funding token code`,
  [FspConfigurationProperties.paymentReferencePrefix]: $localize`Payment reference prefix`,
  [FspConfigurationProperties.corporateCodeOnafriq]: $localize`Corporate code`,
  [FspConfigurationProperties.passwordOnafriq]: $localize`Password`,
  [FspConfigurationProperties.uniqueKeyOnafriq]: $localize`Unique key`,
};
