import { FinancialServiceProviderIntegrationType } from '@121-service/src/financial-service-providers/financial-service-provider-integration-type.enum';

import { getFinancialServiceProviderSettingByName } from '~/domains/financial-service-provider/financial-service-provider.helper';
import {
  FSPS_WITH_PHYSICAL_CARD_SUPPORT,
  FSPS_WITH_VOUCHER_SUPPORT,
} from '~/domains/payment/payment.helpers';
import { Project } from '~/domains/project/project.model';

export function projectHasVoucherSupport(project?: Project) {
  return project?.programFinancialServiceProviderConfigurations.some((fsp) =>
    FSPS_WITH_VOUCHER_SUPPORT.includes(fsp.financialServiceProviderName),
  );
}

export function projectHasPhysicalCardSupport(project?: Project) {
  return project?.programFinancialServiceProviderConfigurations.some((fsp) =>
    FSPS_WITH_PHYSICAL_CARD_SUPPORT.includes(fsp.financialServiceProviderName),
  );
}

export function projectHasFspWithExportFileIntegration(project?: Project) {
  return project?.programFinancialServiceProviderConfigurations.some(
    (fsp) =>
      getFinancialServiceProviderSettingByName(fsp.financialServiceProviderName)
        ?.integrationType === FinancialServiceProviderIntegrationType.csv,
  );
}

export function projectHasInclusionScore(project?: Project): boolean {
  if (project?.programRegistrationAttributes) {
    for (const attribute of project.programRegistrationAttributes) {
      if (Object.keys(attribute.scoring).length > 0) {
        return true;
      }
    }
  }
  return false;
}

export function financialServiceProviderConfigurationNamesHaveIntegrationType({
  project,
  financialServiceProviderConfigurationNames,
  integrationType,
}: {
  project: Project;
  financialServiceProviderConfigurationNames: string[];
  integrationType: FinancialServiceProviderIntegrationType;
}) {
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

  return fspSettings.some((fspSetting) => {
    return fspSetting?.integrationType === integrationType;
  });
}
