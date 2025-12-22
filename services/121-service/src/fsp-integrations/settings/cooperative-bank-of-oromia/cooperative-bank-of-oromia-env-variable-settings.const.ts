import { cooperativeBankOfOromiaEnvVariables, env } from '@121-service/src/env';
import { FspEnvVariablesDto } from '@121-service/src/fsp-management/fsp-env-variables.dto';
import { getEnvVariablesForFsp } from '@121-service/src/fsp-management/fsp-specific/get-env-variables-for-fsp';

export const COOPERATIVE_BANK_OF_OROMIA_ENV_VARIABLE_SETTINGS: FspEnvVariablesDto =
  {
    enabled: env.COOPERATIVE_BANK_OF_OROMIA_ENABLED,
    variables: getEnvVariablesForFsp({
      names: Object.keys(cooperativeBankOfOromiaEnvVariables),
      allEnvVariables: env,
    }),
  };
