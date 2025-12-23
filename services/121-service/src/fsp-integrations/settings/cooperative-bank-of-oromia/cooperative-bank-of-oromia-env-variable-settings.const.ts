import {
  cooperativeBankOfOromiaEnvVariablesSchema,
  env,
} from '@121-service/src/env';
import { getEnvVariablesForFsp } from '@121-service/src/fsp-integrations/settings/get-env-variables-for-fsp';
import { FspEnvVariablesDto } from '@121-service/src/fsp-integrations/shared/dto/fsp-env-variables.dto';

export const COOPERATIVE_BANK_OF_OROMIA_ENV_VARIABLE_SETTINGS: FspEnvVariablesDto =
  {
    enabled: env.COOPERATIVE_BANK_OF_OROMIA_ENABLED,
    variables: getEnvVariablesForFsp({
      names: Object.keys(cooperativeBankOfOromiaEnvVariablesSchema),
      allEnvVariables: env,
    }),
  };
