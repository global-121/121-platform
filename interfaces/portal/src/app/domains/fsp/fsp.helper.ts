import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';

export const getFspSettingByName = (name: Fsps) =>
  FSP_SETTINGS.find((fsp) => fsp.name === name);
