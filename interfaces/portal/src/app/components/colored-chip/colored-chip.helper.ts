import { VisaCardOrderStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-order-status.enum';
import { VisaCard121Status } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/wallet-status-121.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { DuplicateStatus } from '@121-service/src/registration/enum/duplicate-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import {
  VISA_CARD_ORDER_STATUS_LABELS,
  VISA_CARD_STATUS_LABELS,
} from '~/domains/fsp-account-management/intersolve-visa.helper';
import {
  ImportExistingSubmissionsResultKey,
  SUBMISSION_RESULT_LABELS,
} from '~/domains/kobo/kobo.helpers';
import {
  convertTwilioMessageStatusToMessageStatus,
  MESSAGE_STATUS_LABELS,
  MessageStatus,
} from '~/domains/message/message.helper';
import {
  DUPLICATE_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
} from '~/domains/registration/registration.helper';
import { TRANSACTION_STATUS_LABELS } from '~/domains/transaction/transaction.helper';
import { ColorVariant } from '~/utils/color-variant.enum';

export interface ChipData {
  chipLabel: string;
  chipVariant: ColorVariant;
}

const mapValueToChipData = <Enum extends string>({
  value,
  labels,
  chipVariants,
}: {
  value: Enum | null | undefined;
  labels: Record<NonNullable<Enum>, string>;
  chipVariants: Record<NonNullable<Enum>, ColorVariant>;
}): ChipData => {
  if (!value) {
    return {
      chipVariant: ColorVariant.Grey,
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
      [RegistrationStatusEnum.included]: ColorVariant.Green,
      [RegistrationStatusEnum.new]: ColorVariant.Blue,
      [RegistrationStatusEnum.validated]: ColorVariant.Yellow,
      [RegistrationStatusEnum.declined]: ColorVariant.Red,
      [RegistrationStatusEnum.completed]: ColorVariant.Purple,
      [RegistrationStatusEnum.deleted]: ColorVariant.Red,
      [RegistrationStatusEnum.paused]: ColorVariant.Orange,
    },
  });

export const getChipDataByTransactionStatus = (
  status?: null | TransactionStatusEnum,
): ChipData =>
  mapValueToChipData({
    value: status,
    labels: TRANSACTION_STATUS_LABELS,
    chipVariants: {
      [TransactionStatusEnum.pendingApproval]: ColorVariant.Orange,
      [TransactionStatusEnum.approved]: ColorVariant.Purple,
      [TransactionStatusEnum.waiting]: ColorVariant.Blue,
      [TransactionStatusEnum.error]: ColorVariant.Red,
      [TransactionStatusEnum.success]: ColorVariant.Green,
    },
  });

export const getChipDataByTwilioMessageStatus = (status: string): ChipData =>
  mapValueToChipData({
    value: convertTwilioMessageStatusToMessageStatus(status),
    labels: MESSAGE_STATUS_LABELS,
    chipVariants: {
      [MessageStatus.delivered]: ColorVariant.Green,
      [MessageStatus.read]: ColorVariant.Green,
      [MessageStatus.failed]: ColorVariant.Red,
      [MessageStatus.sent]: ColorVariant.Blue,
      [MessageStatus.unknown]: ColorVariant.Blue,
    },
  });

export const getChipDataByVisaCardStatus = (
  status?: null | VisaCard121Status,
): ChipData =>
  mapValueToChipData({
    value: status,
    labels: VISA_CARD_STATUS_LABELS,
    chipVariants: {
      [VisaCard121Status.Unknown]: ColorVariant.Grey,
      [VisaCard121Status.Active]: ColorVariant.Green,
      [VisaCard121Status.Issued]: ColorVariant.Blue,
      [VisaCard121Status.Substituted]: ColorVariant.Red,
      [VisaCard121Status.Blocked]: ColorVariant.Grey,
      [VisaCard121Status.Closed]: ColorVariant.Grey,
      [VisaCard121Status.SuspectedFraud]: ColorVariant.Red,
      [VisaCard121Status.CardDataMissing]: ColorVariant.Orange,
      [VisaCard121Status.Paused]: ColorVariant.Orange,
    },
  });

export const getChipDataByDuplicateStatus = (
  status?: DuplicateStatus | null,
): ChipData =>
  mapValueToChipData({
    value: status,
    labels: DUPLICATE_STATUS_LABELS,
    chipVariants: {
      [DuplicateStatus.unique]: ColorVariant.Green,
      [DuplicateStatus.duplicate]: ColorVariant.Red,
    },
  });

export const getChipDataBySubmissionsKey = (
  status?: ImportExistingSubmissionsResultKey | null,
): ChipData =>
  mapValueToChipData({
    value: status,
    labels: SUBMISSION_RESULT_LABELS,
    chipVariants: {
      [ImportExistingSubmissionsResultKey.numberOfSubmissionsFailed]:
        ColorVariant.Red,
      [ImportExistingSubmissionsResultKey.numberOfSubmissionsImported]:
        ColorVariant.Green,
      [ImportExistingSubmissionsResultKey.numberOfSubmissionsSkipped]:
        ColorVariant.Orange,
    },
  });

export const getChipDataByVisaCardOrderStatus = (
  status: VisaCardOrderStatus,
): ChipData =>
  mapValueToChipData({
    value: status,
    labels: VISA_CARD_ORDER_STATUS_LABELS,
    chipVariants: {
      [VisaCardOrderStatus.Processing]: ColorVariant.Yellow,
      [VisaCardOrderStatus.Completed]: ColorVariant.Green,
    },
  });
