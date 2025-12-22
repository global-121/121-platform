import {
  env,
  intersolveVoucherWhatsappEnvVariables,
} from '@121-service/src/env';
import { FspEnvVariablesDto } from '@121-service/src/fsp-management/fsp-env-variables.dto';
import { getEnvVariablesForFsp } from '@121-service/src/fsp-management/fsp-specific/get-env-variables-for-fsp';

export const INTERSOLVE_VOUCHER_WHATSAPP_ENV_VARIABLE_SETTINGS: FspEnvVariablesDto =
  {
    enabled: env.INTERSOLVE_VOUCHER_WHATSAPP_ENABLED,
    variables: getEnvVariablesForFsp({
      names: Object.keys(intersolveVoucherWhatsappEnvVariables),
      allEnvVariables: env,
    }),
  };
