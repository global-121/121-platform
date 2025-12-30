import {
  commercialBankEthiopiaEnvVariablesSchema,
  env,
} from '@121-service/src/env';
import { getEnvVariablesForFsp } from '@121-service/src/fsp-integrations/settings/get-env-variables-for-fsp';
import { FspEnvVariablesDto } from '@121-service/src/fsp-integrations/shared/dto/fsp-env-variables.dto';

export const COMMERCIAL_BANK_ETHIOPIA_ENV_VARIABLE_SETTINGS: FspEnvVariablesDto =
  {
    mode: env.COMMERCIAL_BANK_ETHIOPIA_MODE,
    variables: getEnvVariablesForFsp({
      names: Object.keys(commercialBankEthiopiaEnvVariablesSchema),
      allEnvVariables: env,
    }),
  };
