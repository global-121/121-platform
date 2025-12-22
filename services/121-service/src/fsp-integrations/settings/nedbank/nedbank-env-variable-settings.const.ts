import { env, nedbankEnvVariables } from '@121-service/src/env';
import { FspEnvVariablesDto } from '@121-service/src/fsp-management/fsp-env-variables.dto';
import { getEnvVariablesForFsp } from '@121-service/src/fsp-management/fsp-specific/get-env-variables-for-fsp';

export const NEDBANK_ENV_VARIABLE_SETTINGS: FspEnvVariablesDto = {
  enabled: env.NEDBANK_ENABLED,
  variables: getEnvVariablesForFsp({
    names: Object.keys(nedbankEnvVariables),
    allEnvVariables: env,
  }),
};
