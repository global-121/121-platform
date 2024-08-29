import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { ChipVariant } from '~/components/colored-chip/colored-chip.component';
import { REGISTRATION_STATUS_LABELS } from '~/utils/translate-status';

export function getChipDataByRegistrationStatus(
  status?: null | RegistrationStatusEnum,
): { chipLabel: string; chipVariant: ChipVariant } {
  if (!status) {
    return {
      chipVariant: 'grey',
      chipLabel: $localize`:@@generic-not-available:Not available`,
    };
  }

  switch (status) {
    case RegistrationStatusEnum.included:
    case RegistrationStatusEnum.registered:
    case RegistrationStatusEnum.validated:
      return {
        chipLabel: REGISTRATION_STATUS_LABELS[status],
        chipVariant: 'green',
      };
    case RegistrationStatusEnum.declined:
    case RegistrationStatusEnum.completed:
    case RegistrationStatusEnum.deleted:
      return {
        chipLabel: REGISTRATION_STATUS_LABELS[status],
        chipVariant: 'red',
      };
    case RegistrationStatusEnum.paused:
      return {
        chipLabel: REGISTRATION_STATUS_LABELS[status],
        chipVariant: 'orange',
      };
  }
}
