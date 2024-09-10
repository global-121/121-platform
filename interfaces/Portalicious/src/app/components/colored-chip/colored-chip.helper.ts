import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { ChipVariant } from '~/components/colored-chip/colored-chip.component';
import { REGISTRATION_STATUS_LABELS } from '~/domains/registration/registration.helper';

export function getChipDataByRegistrationStatus(
  status?: null | RegistrationStatusEnum,
): { chipLabel: string; chipVariant: ChipVariant } {
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
