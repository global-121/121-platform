import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';

export function getFspConfigurationProperties(fspName: Fsps): string[] {
  const foundFsp = FSP_SETTINGS[fspName];
  return foundFsp.configurationProperties.map((property) => property.name);
}

export function getFspConfigurationRequiredProperties(fspName: Fsps): string[] {
  const foundFsp = FSP_SETTINGS[fspName];
  return foundFsp.configurationProperties
    .filter((property) => property.isRequired)
    .map((property) => property.name);
}

export function stringIsFsp(value: string): value is Fsps {
  return Object.values(Fsps).includes(value as Fsps);
}

export function getFspAttributeNames(fspName: Fsps): string[] {
  const fspSettings = FSP_SETTINGS[fspName];
  return fspSettings.attributes.map((attribute) => attribute.name);
}
