import { FspIntegrationType } from '@121-service/src/fsps/fsp-integration-type.enum';

import { getFspSettingByName } from '~/domains/fsp/fsp.helper';
import {
  FSPS_WITH_PHYSICAL_CARD_SUPPORT,
  FSPS_WITH_VOUCHER_SUPPORT,
} from '~/domains/payment/payment.helpers';
import { Project } from '~/domains/project/project.model';

export const projectHasVoucherSupport = (project?: Project): boolean =>
  project?.programFspConfigurations.some((fsp) =>
    FSPS_WITH_VOUCHER_SUPPORT.includes(fsp.fspName),
  ) ?? false;

export const projectHasPhysicalCardSupport = (project?: Project): boolean =>
  project?.programFspConfigurations.some((fsp) =>
    FSPS_WITH_PHYSICAL_CARD_SUPPORT.includes(fsp.fspName),
  ) ?? false;

export const projectHasFspWithExportFileIntegration = (
  project?: Project,
): boolean =>
  project?.programFspConfigurations.some(
    (fsp) =>
      getFspSettingByName(fsp.fspName)?.integrationType ===
      FspIntegrationType.csv,
  ) ?? false;

export const projectHasInclusionScore = (project?: Project): boolean =>
  project?.programRegistrationAttributes.some(
    (attribute) => Object.keys(attribute.scoring).length > 0,
  ) ?? false;

export const fspConfigurationNamesHaveIntegrationType = ({
  project,
  fspConfigurationNames,
  integrationType,
}: {
  project: Project;
  fspConfigurationNames: string[];
  integrationType: FspIntegrationType;
}) => {
  const fspSettings = fspConfigurationNames.map((fspConfigurationName) => {
    const config = project.programFspConfigurations.find(
      (fsp) => fsp.name === fspConfigurationName,
    );

    if (!config) {
      throw new Error(
        `Could not find financial service provider configuration with name ${fspConfigurationName}`,
      );
    }

    return getFspSettingByName(config.fspName);
  });

  return fspSettings.some(
    (fspSetting) => fspSetting?.integrationType === integrationType,
  );
};
