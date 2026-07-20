import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';

export const getFspLabels = ({ fsps }: { fsps: Fsps[] }): string[] =>
  fsps.flatMap((fsp) => FSP_SETTINGS[fsp].defaultLabel.en ?? []);
