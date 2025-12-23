import { EnvVariablesReadOnly } from '@121-service/src/shared/types/env-variables-readonly.type';

export class FspEnvVariablesDto {
  readonly enabled: boolean;

  readonly variables: EnvVariablesReadOnly;
}
