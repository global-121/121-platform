import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';

export const getFspLabels = ({ fsps }: { fsps: Fsps[] }): string[] => {
  const arr = fsps.map((fsp) => FSP_SETTINGS[fsp].defaultLabel.en);
  return arr.filter((label): label is string => label !== undefined);
};
