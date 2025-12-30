import { FspEnvVariablesDto } from '@121-service/src/fsp-integrations/shared/dto/fsp-env-variables.dto';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';

export const EXCEL_ENV_VARIABLE_SETTINGS: FspEnvVariablesDto = {
  // This FSP is the odd one out, so FspMode does not map onto it properly.
  // Because we want to always have this FSP available, in every context, we set
  // it to "FspMode.external" here which basically enables it.
  mode: FspMode.external,
  variables: {},
};
