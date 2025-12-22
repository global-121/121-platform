import { env, onafriqEnvVariables } from '@121-service/src/env';
import { FspEnvVariablesDto } from '@121-service/src/fsp-management/fsp-env-variables.dto';
import { getEnvVariablesForFsp } from '@121-service/src/fsp-management/fsp-specific/get-env-variables-for-fsp';

export const ONAFRIQ_ENV_VARIABLE_SETTINGS: FspEnvVariablesDto = {
  enabled: env.ONAFRIQ_ENABLED,
  variables: getEnvVariablesForFsp({
    names: Object.keys(onafriqEnvVariables),
    allEnvVariables: env,
  }),
};
