import { FinancialServiceProviderIntegrationType } from '@121-service/src/financial-service-providers/financial-service-provider-integration-type.enum';

import { getFinancialServiceProviderSettingByName } from '~/domains/financial-service-provider/financial-service-provider.helper';
import {
  FSPS_WITH_PHYSICAL_CARD_SUPPORT,
  FSPS_WITH_VOUCHER_SUPPORT,
} from '~/domains/payment/payment.helpers';
import { Project } from '~/domains/project/project.model';

export const projectHasVoucherSupport = (project?: Project): boolean =>
  project?.programFinancialServiceProviderConfigurations.some((fsp) =>
    FSPS_WITH_VOUCHER_SUPPORT.includes(fsp.financialServiceProviderName),
  ) ?? false;

export const projectHasPhysicalCardSupport = (project?: Project): boolean =>
  project?.programFinancialServiceProviderConfigurations.some((fsp) =>
    FSPS_WITH_PHYSICAL_CARD_SUPPORT.includes(fsp.financialServiceProviderName),
  ) ?? false;

export const projectHasFspWithExportFileIntegration = (
  project?: Project,
): boolean =>
  project?.programFinancialServiceProviderConfigurations.some(
    (fsp) =>
      getFinancialServiceProviderSettingByName(fsp.financialServiceProviderName)
        ?.integrationType === FinancialServiceProviderIntegrationType.csv,
  ) ?? false;

export const projectHasInclusionScore = (project?: Project): boolean =>
  project?.programRegistrationAttributes.some(
    (attribute) => Object.keys(attribute.scoring).length > 0,
  ) ?? false;

export const financialServiceProviderConfigurationNamesHaveIntegrationType = ({
  project,
  financialServiceProviderConfigurationNames,
  integrationType,
}: {
  project: Project;
  financialServiceProviderConfigurationNames: string[];
  integrationType: FinancialServiceProviderIntegrationType;
}) => {
  const fspSettings = financialServiceProviderConfigurationNames.map(
    (financialServiceProviderConfigurationName) => {
      const config = project.programFinancialServiceProviderConfigurations.find(
        (fsp) => fsp.name === financialServiceProviderConfigurationName,
      );

      if (!config) {
        throw new Error(
          `Could not find financial service provider configuration with name ${financialServiceProviderConfigurationName}`,
        );
      }

      return getFinancialServiceProviderSettingByName(
        config.financialServiceProviderName,
      );
    },
  );

  return fspSettings.some(
    (fspSetting) => fspSetting?.integrationType === integrationType,
  );
};
