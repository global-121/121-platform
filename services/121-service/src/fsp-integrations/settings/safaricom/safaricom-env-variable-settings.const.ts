import { env, safaricomEnvVariablesSchema } from '@121-service/src/env';
import { getEnvVariablesForFsp } from '@121-service/src/fsp-integrations/settings/get-env-variables-for-fsp';
import { FspEnvVariablesDto } from '@121-service/src/fsp-integrations/shared/dto/fsp-env-variables.dto';

export const SAFARICOM_ENV_VARIABLE_SETTINGS: FspEnvVariablesDto = {
  mode: env.SAFARICOM_MODE,
  variables: getEnvVariablesForFsp({
    names: Object.keys(safaricomEnvVariablesSchema),
    allEnvVariables: env,
  }),
};
