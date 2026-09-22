import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { FspIntegrationType } from '@121-service/src/fsp-integrations/shared/enum/fsp-integration-type.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
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
      explanation: {
        en: 'Select a unique identifier - phone number, ID number, or Red Cross registration number - to be used during reconciliation to update the transaction status for each registration.',
      },
    },
    {
      name: FspConfigurationProperties.columnsToExport,
      isRequired: false,
      explanation: {
        en: 'Select the fields to include in the payment report you send to your FSP.',
      },
    },
  ],
};
