import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';

export const FSPS_WITH_VOUCHER_SUPPORT = [
  FinancialServiceProviders.intersolveVoucherPaper,
  FinancialServiceProviders.intersolveVoucherWhatsapp,
];

export const FSPS_WITH_PHYSICAL_CARD_SUPPORT = [
  FinancialServiceProviders.intersolveVisa,
];
