import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';
import { AIRTEL_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/airtel/airtel-settings.const';
import { COMMERCIAL_BANK_ETHIOPIA_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/commercial-bank-ethiopia/commercial-bank-ethiopia-settings.const';
import { COOPERATIVE_BANK_OF_OROMIA_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/cooperative-bank-of-oromia/cooperative-bank-of-oromia-settings.const';
import { EXCEL_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/excel/excel-settings.const';
import { INTERSOLVE_VISA_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/intersolve-visa/intersolve-visa-settings.const';
import { INTERSOLVE_VOUCHER_PAPER_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/intersolve-voucher-paper/intersolve-voucher-paper-settings.const';
import { INTERSOLVE_VOUCHER_WHATSAPP_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/intersolve-voucher-whatsapp/intersolve-voucher-whatsapp-settings.const';
import { NEDBANK_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/nedbank/nedbank-settings.const';
import { ONAFRIQ_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/onafriq/onafriq-settings.const';
import { SAFARICOM_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/safaricom/safaricom-settings.const';

// Attributes are the programRegistrationAttributes that are required for a registration to have a program fsp configuration with the fsp
// Configuration properties are the program financial service configuration properties that are required for the fsp to be able to send a payment
// The order of the configuration properties define the order in which they are displayed in the UI to add/edit a program fsp configuration
export const FSP_SETTINGS: Record<Fsps, FspSettingsDto> = {
  [Fsps.excel]: EXCEL_SETTINGS,
  [Fsps.intersolveVisa]: INTERSOLVE_VISA_SETTINGS,
  [Fsps.intersolveVoucherWhatsapp]: INTERSOLVE_VOUCHER_WHATSAPP_SETTINGS,
  [Fsps.intersolveVoucherPaper]: INTERSOLVE_VOUCHER_PAPER_SETTINGS,
  [Fsps.safaricom]: SAFARICOM_SETTINGS,
  [Fsps.airtel]: AIRTEL_SETTINGS,
  [Fsps.commercialBankEthiopia]: COMMERCIAL_BANK_ETHIOPIA_SETTINGS,
  [Fsps.nedbank]: NEDBANK_SETTINGS,
  [Fsps.onafriq]: ONAFRIQ_SETTINGS,
  [Fsps.cooperativeBankOfOromia]: COOPERATIVE_BANK_OF_OROMIA_SETTINGS,
};
