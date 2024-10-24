import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
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
  switch (attribute.type) {
    case RegistrationAttributeTypes.multiSelect:
      // TODO: Implement multiSelect when necessary
      console.log(
        'attributeToDataListItem: multiSelect not implemented',
        value,
      );
      return undefined;
    case RegistrationAttributeTypes.numeric:
      return {
        label,
        type: 'number',
        value: value as number,
      };
    case RegistrationAttributeTypes.numericNullable:
      return {
        label,
        type: 'number',
        value: value as null | number,
      };
    case RegistrationAttributeTypes.date:
      return {
        label,
        type: 'date',
        value: value as Date,
      };
    case RegistrationAttributeTypes.boolean:
      return {
        label,
        type: 'boolean',
        value: value as boolean,
      };
    case RegistrationAttributeTypes.dropdown:
    case RegistrationAttributeTypes.tel:
    case RegistrationAttributeTypes.text:
      return {
        label,
        type: 'text',
        value: value as LocalizedString | string,
      };
  }
};

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
