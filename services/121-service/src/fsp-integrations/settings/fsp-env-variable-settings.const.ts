import { AIRTEL_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-integrations/settings/airtel/airtel-env-variable-settings.const';
import { COMMERCIAL_BANK_ETHIOPIA_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-integrations/settings/commercial-bank-ethiopia/commercial-bank-ethiopia-env-variable-settings.const';
import { COOPERATIVE_BANK_OF_OROMIA_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-integrations/settings/cooperative-bank-of-oromia/cooperative-bank-of-oromia-env-variable-settings.const';
import { EXCEL_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-integrations/settings/excel/excel-env-variable-settings.const';
import { INTERSOLVE_VISA_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-integrations/settings/intersolve-visa/intersolve-visa-env-variable-settings.const';
import { INTERSOLVE_VOUCHER_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-integrations/settings/intersolve-voucher/intersolve-voucher-env-variable-settings.const';
import { NEDBANK_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-integrations/settings/nedbank/nedbank-env-variable-settings.const';
import { ONAFRIQ_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-integrations/settings/onafriq/onafriq-env-variable-settings.const';
import { SAFARICOM_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-integrations/settings/safaricom/safaricom-env-variable-settings.const';
import { FspEnvVariablesDto } from '@121-service/src/fsp-integrations/shared/dto/fsp-env-variables.dto';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';

// Some ugliness around Intersolve Voucher. Technically it's a single FSP, but
// in most of the code we define it as 2 separate ones:
// 'intersolveVoucherWhatsapp' and 'intersolveVoucherPaper'. We don't do that
// for environment variables though. So here's an exception to that.
// See AB#10288 for more context.
export type FspsWithoutIntersolveVoucherExceptions = Exclude<
  Fsps,
  Fsps.intersolveVoucherPaper | Fsps.intersolveVoucherWhatsapp
> & {
  intersolveVoucher: 'Intersolve-voucher';
};

export type FspEnvVariableSettingsRecord = Record<
  FspsWithoutIntersolveVoucherExceptions,
  FspEnvVariablesDto
>;

// Please keep sorted for readability. (doing this with ESLint requires a custom rule)
export const FSP_ENV_VARIABLE_SETTINGS: FspEnvVariableSettingsRecord = {
  [Fsps.airtel]: AIRTEL_ENV_VARIABLE_SETTINGS,
  [Fsps.commercialBankEthiopia]: COMMERCIAL_BANK_ETHIOPIA_ENV_VARIABLE_SETTINGS,
  [Fsps.cooperativeBankOfOromia]:
    COOPERATIVE_BANK_OF_OROMIA_ENV_VARIABLE_SETTINGS,
  [Fsps.excel]: EXCEL_ENV_VARIABLE_SETTINGS,
  [Fsps.intersolveVisa]: INTERSOLVE_VISA_ENV_VARIABLE_SETTINGS,
  ['Intersolve-voucher']: INTERSOLVE_VOUCHER_ENV_VARIABLE_SETTINGS,
  [Fsps.nedbank]: NEDBANK_ENV_VARIABLE_SETTINGS,
  [Fsps.onafriq]: ONAFRIQ_ENV_VARIABLE_SETTINGS,
  [Fsps.safaricom]: SAFARICOM_ENV_VARIABLE_SETTINGS,
};
