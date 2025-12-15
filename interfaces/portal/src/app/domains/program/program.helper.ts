import { FspIntegrationType } from '@121-service/src/fsp-management/enums/fsp-integration-type.enum';
import { FSP_SETTINGS } from '@121-service/src/fsp-management/fsp-settings.const';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import {
  FSPS_WITH_PHYSICAL_CARD_SUPPORT,
  FSPS_WITH_VOUCHER_SUPPORT,
} from '~/domains/payment/payment.helpers';
import {
  Program,
  ProgramAttachmentFileType,
} from '~/domains/program/program.model';
import { REGISTRATION_STATUS_LABELS } from '~/domains/registration/registration.helper';

export const programHasVoucherSupport = (program?: Program): boolean =>
  program?.programFspConfigurations.some((fsp) =>
    FSPS_WITH_VOUCHER_SUPPORT.includes(fsp.fspName),
  ) ?? false;

export const programHasPhysicalCardSupport = (program?: Program): boolean =>
  program?.programFspConfigurations.some((fsp) =>
    FSPS_WITH_PHYSICAL_CARD_SUPPORT.includes(fsp.fspName),
  ) ?? false;

export const programHasFspWithExportFileIntegration = (
  program?: Program,
): boolean =>
  program?.programFspConfigurations.some(
    (fsp) =>
      FSP_SETTINGS[fsp.fspName].integrationType === FspIntegrationType.csv,
  ) ?? false;

export const programHasInclusionScore = (program?: Program): boolean =>
  program?.programRegistrationAttributes.some(
    (attribute) => Object.keys(attribute.scoring).length > 0,
  ) ?? false;

export const fspConfigurationNamesHaveIntegrationType = ({
  program,
  fspConfigurationNames,
  integrationType,
}: {
  program: Program;
  fspConfigurationNames: string[];
  integrationType: FspIntegrationType;
}) => {
  const fspSettings = fspConfigurationNames.map((fspConfigurationName) => {
    const config = program.programFspConfigurations.find(
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

export const mergeUILanguageForProgramLanguageAttributes = ({
  partialUpdatedProgram,
  originalProgram,
}: {
  partialUpdatedProgram: Partial<Program>;
  originalProgram?: Program;
}): Partial<Program> => {
  for (const [key, updatedValue] of Object.entries(partialUpdatedProgram)) {
    if (isUILanguageTranslationObject(updatedValue)) {
      (partialUpdatedProgram as Record<string, UILanguageTranslation>)[key] =
        mergeExtendUILanguageTranslation({
          original: (originalProgram?.[key as keyof Program] ??
            {}) as UILanguageTranslation,
          updated: updatedValue as UILanguageTranslation,
        });
    }
  }
  return partialUpdatedProgram;
};

const mergeExtendUILanguageTranslation = ({
  original,
  updated,
}: {
  original: UILanguageTranslation;
  updated: UILanguageTranslation;
}): UILanguageTranslation => ({
  ...original,
  ...updated,
});

const isUILanguageTranslationObject = (
  objToValidate: unknown,
): objToValidate is UILanguageTranslation => {
  if (!objToValidate) {
    return false;
  }
  if (typeof objToValidate !== 'object' || Array.isArray(objToValidate)) {
    return false;
  }
  const keys = Object.keys(objToValidate);
  const uiLanguages = Object.values(UILanguage);
  for (const key of keys) {
    if (!uiLanguages.includes(key as UILanguage)) {
      return false;
    }
  }
  return true;
};

export const PROGRAM_ATTACHMENT_FILE_TYPE_LABELS: Record<
  ProgramAttachmentFileType,
  string
> = {
  [ProgramAttachmentFileType.IMAGE]: $localize`:@@program-attachment-file-type-image:Image`,
  [ProgramAttachmentFileType.DOCUMENT]: $localize`:@@program-attachment-file-type-document:Document`,
  [ProgramAttachmentFileType.PDF]: $localize`:@@program-attachment-file-type-pdf:PDF`,
};

export const PROGRAM_ATTACHMENT_FILE_TYPE_ICONS: Record<
  ProgramAttachmentFileType,
  string
> = {
  [ProgramAttachmentFileType.IMAGE]: 'pi pi-image text-purple-600',
  [ProgramAttachmentFileType.DOCUMENT]: 'pi pi-file-word text-blue-500',
  [ProgramAttachmentFileType.PDF]: 'pi pi-file-pdf text-red-500',
};

export const PROGRAM_FORM_TOOLTIPS = {
  targetRegistrations: $localize`The amount of people/households your program plans to reach.`,
  validationProcess: $localize`This enables an additional registration status: "${REGISTRATION_STATUS_LABELS[RegistrationStatusEnum.validated]}".`,
  enableScope: $localize`Scope allows you to control which team members have access to specific registrations, based on the scope they are assigned to in the program team's page.

To use this feature, make sure scope is defined in your integrated Kobo form or Excel table.`,
  currency: $localize`Should be an ISO 4217 currency code (full list available on Wikipedia).`,
  distributionDuration: $localize`The number of times a registration will receive transactions in the program by default.`,
};
