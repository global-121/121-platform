import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

export function isValidStatusChange(
  from: RegistrationStatusEnum,
  to: RegistrationStatusEnum,
): boolean {
  const REGISTERED = RegistrationStatusEnum.registered;
  const VALIDATED = RegistrationStatusEnum.validated;
  const INCLUDED = RegistrationStatusEnum.included;
  const COMPLETED = RegistrationStatusEnum.completed;
  const PAUSED = RegistrationStatusEnum.paused;
  const DECLINED = RegistrationStatusEnum.declined;
  const DELETED = RegistrationStatusEnum.deleted;

  const validStatusChanges = {
    [REGISTERED]: [INCLUDED, VALIDATED, DECLINED, DELETED],
    [VALIDATED]: [INCLUDED, DECLINED, DELETED],
    [INCLUDED]: [COMPLETED, PAUSED, DECLINED, DELETED],
    [COMPLETED]: [INCLUDED, DECLINED, DELETED],
    [PAUSED]: [INCLUDED, DECLINED, DELETED],
    [DECLINED]: [INCLUDED, DELETED],
    [DELETED]: [],
  };

  // Casting necessary because validStatusChanges[DELETED] has type never[].
  return (validStatusChanges[from] as RegistrationStatusEnum[]).includes(to);
}
