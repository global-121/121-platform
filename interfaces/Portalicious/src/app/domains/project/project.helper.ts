import { FinancialServiceProviderIntegrationType } from '@121-service/src/financial-service-providers/enum/financial-service-provider-integration-type.enum';
import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import {
  AnswerTypes,
  CustomAttributeType,
} from '@121-service/src/registration/enum/custom-data-attributes';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

import { DataListItem } from '~/components/data-list/data-list.component';
import {
  FSPS_WITH_PHYSICAL_CARD_SUPPORT,
  FSPS_WITH_VOUCHER_SUPPORT,
} from '~/domains/payment/payment.helpers';
import {
  AttributeWithTranslatedLabel,
  Project,
} from '~/domains/project/project.model';

export const ATTRIBUTE_LABELS: Record<string, string | undefined> = {
  fspDisplayName: $localize`:@@attribute-label-fspDisplayName:FSP Display Name`,
  paymentAmountMultiplier: $localize`:@@attribute-label-paymentAmountMultiplier:Transfer value multiplier`,
  maxPayments: $localize`:@@attribute-label-maxPayments:Max. payments`,
  paymentCountRemaining: $localize`:@@attribute-label-paymentCountRemaining:Remaining payments`,
};

export const attributeToDataListItem = (
  attribute: AttributeWithTranslatedLabel,
  value: unknown,
): DataListItem | undefined => {
  const label = attribute.label;

  // TODO: AB#30519 avoid using "as" here
  switch (attribute.type as AnswerTypes | CustomAttributeType) {
    case AnswerTypes.multiSelect:
      // TODO: Implement multiSelect when necessary
      console.log(
        'attributeToDataListItem: multiSelect not implemented',
        value,
      );
      return undefined;
    case AnswerTypes.numeric:
      return {
        label,
        type: 'number',
        value: value as number,
      };
    case AnswerTypes.numericNullable:
      return {
        label,
        type: 'number',
        value: value as null | number,
      };
    case AnswerTypes.date:
      return {
        label,
        type: 'date',
        value: value as Date,
      };
    case CustomAttributeType.boolean:
      return {
        label,
        type: 'boolean',
        value: value as boolean,
      };
    case AnswerTypes.dropdown:
    case AnswerTypes.tel:
    case AnswerTypes.text:
    case CustomAttributeType.text:
      return {
        label,
        type: 'text',
        value: value as LocalizedString | string,
      };
  }
};

// TODO: AB#31594 all of the below helpers should be changed in the refactor registration data branch
// to use "fsp configurations" instead of "financial service providers"

export function projectHasVoucherSupport(project?: Project) {
  return project?.financialServiceProviders.some((fsp) =>
    FSPS_WITH_VOUCHER_SUPPORT.includes(fsp.fsp),
  );
}

export function projectHasPhysicalCardSupport(project?: Project) {
  return project?.financialServiceProviders.some((fsp) =>
    FSPS_WITH_PHYSICAL_CARD_SUPPORT.includes(fsp.fsp),
  );
}

export function projectHasFspWithExportFileIntegration(project?: Project) {
  return project?.financialServiceProviders.some(
    (fsp) =>
      fsp.integrationType === FinancialServiceProviderIntegrationType.csv,
  );
}

export function fspsHaveExcelFsp(fsps: FinancialServiceProviders[]) {
  return fsps.some((fsp) => fsp === FinancialServiceProviders.excel);
}

export function fspsHaveIntegratedFsp(fsps: FinancialServiceProviders[]) {
  return fsps.some((fsp) => fsp !== FinancialServiceProviders.excel);
}
