import { commercialBankEthiopiaEnvVariables, env } from '@121-service/src/env';
import { FspEnvVariablesDto } from '@121-service/src/fsp-management/fsp-env-variables.dto';
import { getEnvVariablesForFsp } from '@121-service/src/fsp-management/fsp-specific/get-env-variables-for-fsp';

export const COMMERCIAL_BANK_ETHIOPIA_ENV_VARIABLE_SETTINGS: FspEnvVariablesDto =
  {
    enabled: env.COMMERCIAL_BANK_ETHIOPIA_ENABLED,
    variables: getEnvVariablesForFsp({
      names: Object.keys(commercialBankEthiopiaEnvVariables),
      allEnvVariables: env,
    }),
  };
