import { FspIntegrationType } from '@121-service/src/fsp-management/enums/fsp-integration-type.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';

export const EXCEL_SETTINGS: FspSettingsDto = {
  name: Fsps.excel,
  integrationType: FspIntegrationType.csv,
  defaultLabel: {
    en: 'Excel Payment Instructions',
  },
  attributes: [],
  configurationProperties: [
    {
      name: FspConfigurationProperties.columnToMatch,
      isRequired: true,
    },
    {
      name: FspConfigurationProperties.columnsToExport,
      isRequired: false,
    },
  ],
};
