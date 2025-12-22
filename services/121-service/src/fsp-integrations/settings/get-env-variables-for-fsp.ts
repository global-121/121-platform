import { EnvVariables } from '@121-service/src/shared/types/env-variables.type';
import { EnvVariablesReadOnly } from '@121-service/src/shared/types/env-variables-readonly.type';

export const getEnvVariablesForFsp = ({
  names,
  allEnvVariables,
}: {
  names: string[];
  allEnvVariables: EnvVariablesReadOnly;
}): EnvVariablesReadOnly => {
  return names.reduce((fspSpecificVariables, name) => {
    fspSpecificVariables[name] = allEnvVariables[name];
    return fspSpecificVariables;
  }, {} as EnvVariables);
};
