import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import { ChipVariant } from '~/components/colored-chip/colored-chip.component';
import {
  REGISTRATION_STATUS_LABELS,
  VISA_CARD_STATUS_LABELS,
} from '~/domains/registration/registration.helper';
// TODO: AB#30525 should import this from 121-service
import { VisaCard121Status } from '~/domains/registration/registration.model';

export interface ChipData {
  chipLabel: string;
  chipVariant: ChipVariant;
}

export function getChipDataByRegistrationStatus(
  status?: null | RegistrationStatusEnum,
): ChipData {
  if (!status) {
    return {
      chipVariant: 'grey',
      chipLabel: $localize`:@@generic-not-available:Not available`,
    };
  }
  const chipLabel = REGISTRATION_STATUS_LABELS[status];
  switch (status) {
    case RegistrationStatusEnum.included:
    case RegistrationStatusEnum.registered:
    case RegistrationStatusEnum.validated:
      return {
        chipLabel,
        chipVariant: 'green',
      };
    case RegistrationStatusEnum.declined:
    case RegistrationStatusEnum.completed:
    case RegistrationStatusEnum.deleted:
      return {
        chipLabel,
        chipVariant: 'red',
      };
    case RegistrationStatusEnum.paused:
      return {
        chipLabel,
        chipVariant: 'orange',
      };
  }
}

export function getChipDataByTransactionStatusEnum(
  status?: null | TransactionStatusEnum,
): ChipData {
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
}

export function getChipDataByVisaCardStatus(
  status?: null | VisaCard121Status,
): ChipData {
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
}
