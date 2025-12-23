import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';

export const FSP_CONFIGURATION_PROPERTY_LABELS: Record<
  FspConfigurationProperties,
  string
> = {
  [FspConfigurationProperties.password]: $localize`Password`,
  [FspConfigurationProperties.username]: $localize`Username`,
  [FspConfigurationProperties.columnsToExport]: $localize`Columns to export`,
  [FspConfigurationProperties.columnToMatch]: $localize`Field for identifying registrations`,
  [FspConfigurationProperties.brandCode]: $localize`Brand code`,
  [FspConfigurationProperties.coverLetterCode]: $localize`Cover letter code`,
  [FspConfigurationProperties.fundingTokenCode]: $localize`Funding token code`,
  [FspConfigurationProperties.paymentReferencePrefix]: $localize`Payment reference prefix`,
  [FspConfigurationProperties.corporateCodeOnafriq]: $localize`Corporate code`,
  [FspConfigurationProperties.passwordOnafriq]: $localize`Password`,
  [FspConfigurationProperties.uniqueKeyOnafriq]: $localize`Unique key`,
  [FspConfigurationProperties.debitAccountNumber]: $localize`Debit account number`,
  [FspConfigurationProperties.cardDistributionByMail]: $localize`Card distribution by mail`,
};

export const FSP_IMAGE_URLS: Record<Fsps, string> = {
  [Fsps.intersolveVoucherWhatsapp]: 'assets/fsps/ah.png',
  [Fsps.intersolveVoucherPaper]: 'assets/fsps/ah.png',
  [Fsps.intersolveVisa]: 'assets/fsps/visa.png',
  [Fsps.safaricom]: 'assets/fsps/safaricom.png',
  [Fsps.airtel]: 'assets/fsps/airtel.svg',
  [Fsps.commercialBankEthiopia]: 'assets/fsps/cbe.png',
  [Fsps.excel]: 'assets/fsps/excel.png',
  [Fsps.nedbank]: 'assets/fsps/nedbank.png',
  [Fsps.onafriq]: 'assets/fsps/onafriq.jpg',
  [Fsps.cooperativeBankOfOromia]: 'assets/fsps/cbo.png',
};
