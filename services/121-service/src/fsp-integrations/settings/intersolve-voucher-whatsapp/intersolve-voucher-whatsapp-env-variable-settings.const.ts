import {
  env,
  intersolveVoucherWhatsappEnvVariables,
} from '@121-service/src/env';
import { getEnvVariablesForFsp } from '@121-service/src/fsp-integrations/settings/get-env-variables-for-fsp';
import { FspEnvVariablesDto } from '@121-service/src/fsp-integrations/shared/dto/fsp-env-variables.dto';

export const INTERSOLVE_VOUCHER_WHATSAPP_ENV_VARIABLE_SETTINGS: FspEnvVariablesDto =
  {
    enabled: env.INTERSOLVE_VOUCHER_WHATSAPP_ENABLED,
    variables: getEnvVariablesForFsp({
      names: Object.keys(intersolveVoucherWhatsappEnvVariables),
      allEnvVariables: env,
    }),
  };
