import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { AIRTEL_USER_CONFIGURABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/airtel/airtel-user-configurable-settings.const';
import { COMMERCIAL_BANK_ETHIOPIA_USER_CONFIGURABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/commercial-bank-ethiopia/commercial-bank-ethiopia-user-configurable-settings.const';
import { COOPERATIVE_BANK_OF_OROMIA_USER_CONFIGURABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/cooperative-bank-of-oromia/cooperative-bank-of-oromia-user-configurable-settings.const';
import { EXCEL_USER_CONFIGURABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/excel/excel-user-configurable-settings.const';
import { INTERSOLVE_VISA_USER_CONFIGURABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/intersolve-visa/intersolve-visa-user-configurable-settings.const';
import { INTERSOLVE_VOUCHER_PAPER_USER_CONFIGURABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/intersolve-voucher-paper/intersolve-voucher-paper-user-configurable-settings.const';
import { INTERSOLVE_VOUCHER_WHATSAPP_USER_CONFIGURABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/intersolve-voucher-whatsapp/intersolve-voucher-whatsapp-user-configurable-settings.const';
import { NEDBANK_USER_CONFIGURABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/nedbank/nedbank-user-configurable-settings.const';
import { ONAFRIQ_USER_CONFIGURABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/onafriq/onafriq-user-configurable-settings.const';
import { SAFARICOM_USER_CONFIGURABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/safaricom/safaricom-user-configurable-settings.const';
import { FspUserConfigurableDto } from '@121-service/src/fsp-management/fsp-user-configurable.dto';

// Attributes are the programRegistrationAttributes that are required for a registration to have a program fsp configuration with the fsp
// Configuration properties are the program financial service configuration properties that are required for the fsp to be able to send a payment
// The order of the configuration properties define the order in which they are displayed in the UI to add/edit a program fsp configuration
export const FSP_USER_CONFIGURABLE_SETTINGS: Record<
  Fsps,
  FspUserConfigurableDto
> = {
  [Fsps.excel]: EXCEL_USER_CONFIGURABLE_SETTINGS,
  [Fsps.intersolveVisa]: INTERSOLVE_VISA_USER_CONFIGURABLE_SETTINGS,
  [Fsps.intersolveVoucherWhatsapp]:
    INTERSOLVE_VOUCHER_WHATSAPP_USER_CONFIGURABLE_SETTINGS,
  [Fsps.intersolveVoucherPaper]:
    INTERSOLVE_VOUCHER_PAPER_USER_CONFIGURABLE_SETTINGS,
  [Fsps.safaricom]: SAFARICOM_USER_CONFIGURABLE_SETTINGS,
  [Fsps.airtel]: AIRTEL_USER_CONFIGURABLE_SETTINGS,
  [Fsps.commercialBankEthiopia]:
    COMMERCIAL_BANK_ETHIOPIA_USER_CONFIGURABLE_SETTINGS,
  [Fsps.nedbank]: NEDBANK_USER_CONFIGURABLE_SETTINGS,
  [Fsps.onafriq]: ONAFRIQ_USER_CONFIGURABLE_SETTINGS,
  [Fsps.cooperativeBankOfOromia]:
    COOPERATIVE_BANK_OF_OROMIA_USER_CONFIGURABLE_SETTINGS,
};
