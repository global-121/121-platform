import {
  AnswerTypes,
  CustomAttributeType,
} from '@121-service/src/registration/enum/custom-data-attributes';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

import { DataListItem } from '~/components/data-list/data-list.component';
import { Attribute } from '~/domains/project/project.model';

export const ATTRIBUTE_LABELS: Record<string, string | undefined> = {
  fspDisplayName: $localize`:@@attribute-label-fspDisplayName:FSP Display Name`,
  paymentAmountMultiplier: $localize`:@@attribute-label-paymentAmountMultiplier:Transfer value multiplier`,
  maxPayments: $localize`:@@attribute-label-maxPayments:Max. payments`,
  paymentCountRemaining: $localize`:@@attribute-label-paymentCountRemaining:Remaining payments`,
};

export const attributeToDataListItem = (
  attribute: Attribute,
  value: unknown,
): DataListItem | undefined => {
  const label =
    attribute.label ?? ATTRIBUTE_LABELS[attribute.name] ?? attribute.name;

  // XXX: safer check to make sure attribute.type is an AnswerTypes?
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
