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
  REGISTRATION_STATUS_LABELS,
  VISA_CARD_STATUS_LABELS,
} from '~/domains/registration/registration.helper';
import { TRANSACTION_STATUS_LABELS } from '~/domains/transaction/transaction.helper';

export interface ChipData {
  chipLabel: string;
  chipVariant: ChipVariant;
}

const mapValueToChipData = <Enum extends string>(
  value: Enum | null | undefined,
  labels: Record<NonNullable<Enum>, string>,
  chipVariants: Record<NonNullable<Enum>, ChipVariant>,
): ChipData => {
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
  mapValueToChipData(status, REGISTRATION_STATUS_LABELS, {
    [RegistrationStatusEnum.included]: 'green',
    [RegistrationStatusEnum.registered]: 'blue',
    [RegistrationStatusEnum.validated]: 'yellow',
    [RegistrationStatusEnum.declined]: 'red',
    [RegistrationStatusEnum.completed]: 'purple',
    [RegistrationStatusEnum.deleted]: 'red',
    [RegistrationStatusEnum.paused]: 'orange',
  });

export const getChipDataByTransactionStatus = (
  status?: null | TransactionStatusEnum,
): ChipData =>
  mapValueToChipData(status, TRANSACTION_STATUS_LABELS, {
    [TransactionStatusEnum.waiting]: 'blue',
    [TransactionStatusEnum.error]: 'red',
    [TransactionStatusEnum.success]: 'green',
  });

export const getChipDataByTwilioMessageStatus = (status: string): ChipData =>
  mapValueToChipData(
    convertTwilioMessageStatusToMessageStatus(status),
    MESSAGE_STATUS_LABELS,
    {
      [MessageStatus.delivered]: 'green',
      [MessageStatus.read]: 'green',
      [MessageStatus.failed]: 'red',
      [MessageStatus.sent]: 'blue',
      [MessageStatus.unknown]: 'blue',
    },
  );

export const getChipDataByVisaCardStatus = (
  status?: null | VisaCard121Status,
): ChipData =>
  mapValueToChipData(status, VISA_CARD_STATUS_LABELS, {
    [VisaCard121Status.Unknown]: 'grey',
    [VisaCard121Status.Active]: 'green',
    [VisaCard121Status.Issued]: 'blue',
    [VisaCard121Status.Substituted]: 'red',
    [VisaCard121Status.Blocked]: 'red',
    [VisaCard121Status.SuspectedFraud]: 'red',
    [VisaCard121Status.CardDataMissing]: 'orange',
    [VisaCard121Status.Paused]: 'orange',
  });
