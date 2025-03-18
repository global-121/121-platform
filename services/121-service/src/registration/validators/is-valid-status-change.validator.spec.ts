import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { isValidStatusChange } from '@121-service/src/registration/validators/is-valid-status-change.validator';

const REGISTERED = RegistrationStatusEnum.registered;
const VALIDATED = RegistrationStatusEnum.validated;
const INCLUDED = RegistrationStatusEnum.included;
const DELETED = RegistrationStatusEnum.deleted;
const COMPLETED = RegistrationStatusEnum.completed;
const PAUSED = RegistrationStatusEnum.paused;
const DECLINED = RegistrationStatusEnum.declined;

describe('isValidStatusChange', () => {
  test.concurrent.each([
    // Registered to...
    [REGISTERED, REGISTERED, false],
    [REGISTERED, INCLUDED, true],
    [REGISTERED, VALIDATED, true],
    [REGISTERED, DECLINED, true],
    [REGISTERED, PAUSED, false],
    [REGISTERED, COMPLETED, false],
    [REGISTERED, DELETED, true],

    // Validated to...
    [VALIDATED, REGISTERED, false],
    [VALIDATED, VALIDATED, false],
    [VALIDATED, INCLUDED, true],
    [VALIDATED, DECLINED, true],
    [VALIDATED, PAUSED, false],
    [VALIDATED, COMPLETED, false],
    [VALIDATED, DELETED, true],

    // Included to...
    [INCLUDED, REGISTERED, false],
    [INCLUDED, VALIDATED, false],
    [INCLUDED, INCLUDED, false],
    [INCLUDED, DECLINED, true],
    [INCLUDED, PAUSED, true],
    [INCLUDED, COMPLETED, true],
    [INCLUDED, DELETED, true],

    // Completed to...
    [COMPLETED, REGISTERED, false],
    [COMPLETED, VALIDATED, false],
    [COMPLETED, INCLUDED, true],
    [COMPLETED, DECLINED, true],
    [COMPLETED, PAUSED, false],
    [COMPLETED, COMPLETED, false],
    [COMPLETED, DELETED, true],

    // Paused to...
    [PAUSED, REGISTERED, false],
    [PAUSED, VALIDATED, false],
    [PAUSED, INCLUDED, true],
    [PAUSED, DECLINED, true],
    [PAUSED, PAUSED, false],
    [PAUSED, COMPLETED, false],
    [PAUSED, DELETED, true],

    // Declined to...
    [DECLINED, REGISTERED, false],
    [DECLINED, VALIDATED, false],
    [DECLINED, INCLUDED, true],
    [DECLINED, DECLINED, false],
    [DECLINED, PAUSED, false],
    [DECLINED, COMPLETED, false],
    [DECLINED, DELETED, true],

    // Deleted to...
    [DELETED, REGISTERED, false],
    [DELETED, VALIDATED, false],
    [DELETED, INCLUDED, false],
    [DELETED, DECLINED, false],
    [DELETED, PAUSED, false],
    [DELETED, COMPLETED, false],
    [DELETED, DELETED, false],
  ])(`Change registration from "%s" to "%s"`, async (from, to, isValid) => {
    expect(isValidStatusChange(from, to)).toBe(isValid);
  });
});
