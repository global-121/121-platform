import { FspIntegrationType } from '@121-service/src/fsps/enums/fsp-integration-type.enum';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import {
  FSPS_WITH_PHYSICAL_CARD_SUPPORT,
  FSPS_WITH_VOUCHER_SUPPORT,
} from '~/domains/payment/payment.helpers';
import {
  Project,
  ProjectAttachmentFileType,
} from '~/domains/project/project.model';
import { REGISTRATION_STATUS_LABELS } from '~/domains/registration/registration.helper';

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
      FSP_SETTINGS[fsp.fspName].integrationType === FspIntegrationType.csv,
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

    return FSP_SETTINGS[config.fspName];
  });

  return fspSettings.some(
    (fspSetting) => fspSetting.integrationType === integrationType,
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

export const PROJECT_FORM_TOOLTIPS = {
  targetRegistrations: $localize`The amount of people/households your project plans to reach.`,
  validationProcess: $localize`This enables an additional registration status: "${REGISTRATION_STATUS_LABELS[RegistrationStatusEnum.validated]}".`,
  enableScope: $localize`Scope allows you to control which team members have access to specific registrations, based on the scope they are assigned to in the project team's page.

To use this feature, make sure scope is defined in your integrated Kobo form or Excel table.`,
  currency: $localize`Should be an ISO 4217 currency code (full list available on Wikipedia).`,
  distributionDuration: $localize`The number of times a registration will receive transfers in the project by default.`,
};
