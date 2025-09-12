import { FspIntegrationType } from '@121-service/src/fsps/enums/fsp-integration-type.enum';

import { getFspSettingByName } from '~/domains/fsp/fsp.helper';
import {
  FSPS_WITH_PHYSICAL_CARD_SUPPORT,
  FSPS_WITH_VOUCHER_SUPPORT,
} from '~/domains/payment/payment.helpers';
import {
  Project,
  ProjectAttachmentFileType,
} from '~/domains/project/project.model';

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

export const PROJECT_ATTACHMENT_FILE_TYPE_LABELS: Record<
  ProjectAttachmentFileType,
  string
> = {
  [ProjectAttachmentFileType.IMAGE]: $localize`:@@project-attachment-file-type-image:Image`,
  [ProjectAttachmentFileType.DOCUMENT]: $localize`:@@project-attachment-file-type-document:Document`,
  [ProjectAttachmentFileType.PDF]: $localize`:@@project-attachment-file-type-pdf:PDF`,
};

export const PROJECT_ATTACHMENT_FILE_TYPE_ICONS: Record<
  ProjectAttachmentFileType,
  string
> = {
  [ProjectAttachmentFileType.IMAGE]: 'pi pi-image text-purple-600',
  [ProjectAttachmentFileType.DOCUMENT]: 'pi pi-file-word text-blue-500',
  [ProjectAttachmentFileType.PDF]: 'pi pi-file-pdf text-red-500',
};
