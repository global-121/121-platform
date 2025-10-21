import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';

export function getFspConfigurationProperties(fspName: Fsps): string[] {
  const foundFsp = FSP_SETTINGS[fspName];
  return foundFsp.configurationProperties.map((property: any) => property.name);
}

export function getFspConfigurationRequiredProperties(fspName: Fsps): string[] {
  const foundFsp = FSP_SETTINGS[fspName];
  return foundFsp.configurationProperties
    .filter((property: any) => property.isRequired)
    .map((property: any) => property.name);
}

export function stringIsFsp(value: string): value is Fsps {
  return Object.values(Fsps).includes(value as Fsps);
}
