import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FspDto } from '@121-service/src/fsps/fsp.dto';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';

export function getFspSettingByNameOrThrow(name: string): FspDto {
  const foundFsp = FSP_SETTINGS.find((fsp) => fsp.name === name);
  if (!foundFsp) {
    throw new Error(`Fsp with name ${name} not found`);
  } else {
    return foundFsp;
  }
}

export function getFspConfigurationProperties(fspName: Fsps): string[] {
  const foundFsp = getFspSettingByNameOrThrow(fspName);
  return foundFsp.configurationProperties.map((property) => property.name);
}

export function getFspConfigurationRequiredProperties(fspName: Fsps): string[] {
  const foundFsp = getFspSettingByNameOrThrow(fspName);
  return foundFsp.configurationProperties
    .filter((property) => property.isRequired)
    .map((property) => property.name);
}
