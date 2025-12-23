import { env, onafriqEnvVariablesSchema } from '@121-service/src/env';
import { getEnvVariablesForFsp } from '@121-service/src/fsp-integrations/settings/get-env-variables-for-fsp';
import { FspEnvVariablesDto } from '@121-service/src/fsp-integrations/shared/dto/fsp-env-variables.dto';

export const ONAFRIQ_ENV_VARIABLE_SETTINGS: FspEnvVariablesDto = {
  enabled: env.ONAFRIQ_ENABLED,
  variables: getEnvVariablesForFsp({
    names: Object.keys(onafriqEnvVariablesSchema),
    allEnvVariables: env,
  }),
};
