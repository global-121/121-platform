import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/wallet-status-121.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import { ChipVariant } from '~/components/colored-chip/colored-chip.component';
import {
  convertTwilioMessageStatusToMessageStatus,
  MESSAGE_STATUS_LABELS,
  MessageStatus,
} from '~/domains/message/message.helper';
import {
  REGISTRATION_STATUS_CHIP_VARIANTS,
  REGISTRATION_STATUS_LABELS,
  VISA_CARD_STATUS_LABELS,
} from '~/domains/registration/registration.helper';

export interface ChipData {
  chipLabel: string;
  chipVariant: ChipVariant;
}

export const getChipDataByRegistrationStatus = (
  status?: null | RegistrationStatusEnum,
): ChipData => {
  if (!status) {
    return {
      chipVariant: 'grey',
      chipLabel: $localize`:@@generic-not-available:Not available`,
    };
  }

  return {
    chipLabel: REGISTRATION_STATUS_LABELS[status],
    chipVariant: REGISTRATION_STATUS_CHIP_VARIANTS[status],
  };
};

export const getChipDataByTransactionStatusEnum = (
  status?: null | TransactionStatusEnum,
): ChipData => {
  if (!status) {
    return {
      chipVariant: 'grey',
      chipLabel: $localize`:@@generic-not-available:Not available`,
    };
  }
  switch (status) {
    case TransactionStatusEnum.success:
      return {
        chipLabel: $localize`:@@generic-success:Success`,
        chipVariant: 'green',
      };
    case TransactionStatusEnum.waiting:
      return {
        chipLabel: $localize`:@@generic-pending:Pending`,
        chipVariant: 'orange',
      };
    case TransactionStatusEnum.error:
      return {
        chipLabel: $localize`:@@generic-error:Error`,
        chipVariant: 'red',
      };
  }
};

export const getChipDataByTwilioMessageStatus = (status: string): ChipData => {
  const messageStatus = convertTwilioMessageStatusToMessageStatus(status);
  const chipLabel = MESSAGE_STATUS_LABELS[messageStatus];

  switch (messageStatus) {
    case MessageStatus.delivered:
    case MessageStatus.read:
      return {
        chipLabel,
        chipVariant: 'green',
      };
    case MessageStatus.failed:
      return {
        chipLabel,
        chipVariant: 'red',
      };
    case MessageStatus.sent:
    default:
      return {
        chipLabel,
        chipVariant: 'blue',
      };
  }
};

export const getChipDataByVisaCardStatus = (
  status?: null | VisaCard121Status,
): ChipData => {
  if (!status) {
    return {
      chipVariant: 'grey',
      chipLabel: $localize`:@@generic-not-available:Not available`,
    };
  }

  const chipLabel = VISA_CARD_STATUS_LABELS[status];
  switch (status) {
    case VisaCard121Status.Unknown:
      return {
        chipLabel,
        chipVariant: 'grey',
      };
    case VisaCard121Status.Active:
      return {
        chipLabel,
        chipVariant: 'green',
      };
    case VisaCard121Status.Issued:
      return {
        chipLabel,
        chipVariant: 'blue',
      };
    case VisaCard121Status.Substituted:
    case VisaCard121Status.Blocked:
    case VisaCard121Status.SuspectedFraud:
      return {
        chipLabel,
        chipVariant: 'red',
      };
    case VisaCard121Status.CardDataMissing:
    case VisaCard121Status.Paused:
      return {
        chipLabel,
        chipVariant: 'orange',
      };
  }
};
