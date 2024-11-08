import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';

export const FSPS_WITH_VOUCHER_SUPPORT = [
  FinancialServiceProviderName.intersolveVoucherPaper,
  FinancialServiceProviderName.intersolveVoucherWhatsapp,
];

export const FSPS_WITH_PHYSICAL_CARD_SUPPORT = [
  FinancialServiceProviderName.intersolveVisa,
];
