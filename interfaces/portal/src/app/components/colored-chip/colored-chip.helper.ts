import { VisaCard121Status } from '@121-service/src/fsp-integrations/api-integrations/intersolve-visa/enums/wallet-status-121.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { DuplicateStatus } from '@121-service/src/registration/enum/duplicate-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import { ChipVariant } from '~/components/colored-chip/colored-chip.component';
import {
  convertTwilioMessageStatusToMessageStatus,
  MESSAGE_STATUS_LABELS,
  MessageStatus,
} from '~/domains/message/message.helper';
import {
  DUPLICATE_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
  VISA_CARD_STATUS_LABELS,
} from '~/domains/registration/registration.helper';
import { TRANSACTION_STATUS_LABELS } from '~/domains/transaction/transaction.helper';

export interface ChipData {
  chipLabel: string;
  chipVariant: ChipVariant;
}

const mapValueToChipData = <Enum extends string>({
  value,
  labels,
  chipVariants,
}: {
  value: Enum | null | undefined;
  labels: Record<NonNullable<Enum>, string>;
  chipVariants: Record<NonNullable<Enum>, ChipVariant>;
}): ChipData => {
  if (!value) {
    return {
      chipVariant: 'grey',
      chipLabel: $localize`:@@generic-not-available:Not available`,
    };
  }

  return {
    chipLabel: labels[value],
    chipVariant: chipVariants[value],
  };
};

export const getChipDataByRegistrationStatus = (
  status?: null | RegistrationStatusEnum,
): ChipData =>
  mapValueToChipData({
    value: status,
    labels: REGISTRATION_STATUS_LABELS,
    chipVariants: {
      [RegistrationStatusEnum.included]: 'green',
      [RegistrationStatusEnum.new]: 'blue',
      [RegistrationStatusEnum.validated]: 'yellow',
      [RegistrationStatusEnum.declined]: 'red',
      [RegistrationStatusEnum.completed]: 'purple',
      [RegistrationStatusEnum.deleted]: 'red',
      [RegistrationStatusEnum.paused]: 'orange',
    },
  });

export const getChipDataByTransactionStatus = (
  status?: null | TransactionStatusEnum,
): ChipData =>
  mapValueToChipData({
    value: status,
    labels: TRANSACTION_STATUS_LABELS,
    chipVariants: {
      [TransactionStatusEnum.pendingApproval]: 'orange',
      [TransactionStatusEnum.approved]: 'purple',
      [TransactionStatusEnum.waiting]: 'blue',
      [TransactionStatusEnum.error]: 'red',
      [TransactionStatusEnum.success]: 'green',
    },
  });

export const getChipDataByTwilioMessageStatus = (status: string): ChipData =>
  mapValueToChipData({
    value: convertTwilioMessageStatusToMessageStatus(status),
    labels: MESSAGE_STATUS_LABELS,
    chipVariants: {
      [MessageStatus.delivered]: 'green',
      [MessageStatus.read]: 'green',
      [MessageStatus.failed]: 'red',
      [MessageStatus.sent]: 'blue',
      [MessageStatus.unknown]: 'blue',
    },
  });

export const getChipDataByVisaCardStatus = (
  status?: null | VisaCard121Status,
): ChipData =>
  mapValueToChipData({
    value: status,
    labels: VISA_CARD_STATUS_LABELS,
    chipVariants: {
      [VisaCard121Status.Unknown]: 'grey',
      [VisaCard121Status.Active]: 'green',
      [VisaCard121Status.Issued]: 'blue',
      [VisaCard121Status.Substituted]: 'red',
      [VisaCard121Status.Blocked]: 'red',
      [VisaCard121Status.SuspectedFraud]: 'red',
      [VisaCard121Status.CardDataMissing]: 'orange',
      [VisaCard121Status.Paused]: 'orange',
    },
  });

export const getChipDataByDuplicateStatus = (
  status?: DuplicateStatus | null,
): ChipData =>
  mapValueToChipData({
    value: status,
    labels: DUPLICATE_STATUS_LABELS,
    chipVariants: {
      [DuplicateStatus.unique]: 'green',
      [DuplicateStatus.duplicate]: 'red',
    },
  });
