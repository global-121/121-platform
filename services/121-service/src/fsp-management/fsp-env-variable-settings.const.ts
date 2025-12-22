import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { FspEnvVariablesDto } from '@121-service/src/fsp-management/fsp-env-variables.dto';
import { AIRTEL_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/airtel/airtel-env-variable-settings.const';
import { COMMERCIAL_BANK_ETHIOPIA_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/commercial-bank-ethiopia/commercial-bank-ethiopia-env-variable-settings.const';
import { COOPERATIVE_BANK_OF_OROMIA_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/cooperative-bank-of-oromia/cooperative-bank-of-oromia-env-variable-settings.const';
import { EXCEL_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/excel/excel-env-variable-settings.const';
import { INTERSOLVE_VISA_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/intersolve-visa/intersolve-visa-env-variable-settings.const';
import { INTERSOLVE_VOUCHER_PAPER_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/intersolve-voucher-paper/intersolve-voucher-paper-env-variable-settings.const';
import { INTERSOLVE_VOUCHER_WHATSAPP_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/intersolve-voucher-whatsapp/intersolve-voucher-whatsapp-env-variable-settings.const';
import { NEDBANK_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/nedbank/nedbank-env-variable-settings.const';
import { ONAFRIQ_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/onafriq/onafriq-env-variable-settings.const';
import { SAFARICOM_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-management/fsp-specific/safaricom/safaricom-env-variable-settings.const';

// Please keep sorted. (doing this with ESLint requires a custom rule)
export const FSP_ENV_VARIABLE_SETTINGS: Record<Fsps, FspEnvVariablesDto> = {
  [Fsps.airtel]: AIRTEL_ENV_VARIABLE_SETTINGS,
  [Fsps.commercialBankEthiopia]: COMMERCIAL_BANK_ETHIOPIA_ENV_VARIABLE_SETTINGS,
  [Fsps.cooperativeBankOfOromia]:
    COOPERATIVE_BANK_OF_OROMIA_ENV_VARIABLE_SETTINGS,
  [Fsps.excel]: EXCEL_ENV_VARIABLE_SETTINGS,
  [Fsps.intersolveVisa]: INTERSOLVE_VISA_ENV_VARIABLE_SETTINGS,
  [Fsps.intersolveVoucherPaper]: INTERSOLVE_VOUCHER_PAPER_ENV_VARIABLE_SETTINGS,
  [Fsps.intersolveVoucherWhatsapp]:
    INTERSOLVE_VOUCHER_WHATSAPP_ENV_VARIABLE_SETTINGS,
  [Fsps.nedbank]: NEDBANK_ENV_VARIABLE_SETTINGS,
  [Fsps.onafriq]: ONAFRIQ_ENV_VARIABLE_SETTINGS,
  [Fsps.safaricom]: SAFARICOM_ENV_VARIABLE_SETTINGS,
};
