import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { StatusChangeHelper } from '@121-service/src/registration/helpers/status-change.helper';

const {
  registered,
  validated,
  included,
  completed,
  paused,
  declined,
  deleted,
} = RegistrationStatusEnum;

describe('isValidStatusChange', () => {
  test.concurrent.each([
    // registered to...
    [registered, registered, false],
    [registered, included, true],
    [registered, validated, true],
    [registered, declined, true],
    [registered, paused, false],
    [registered, completed, false],
    [registered, deleted, true],

    // validated to...
    [validated, registered, false],
    [validated, validated, false],
    [validated, included, true],
    [validated, declined, true],
    [validated, paused, false],
    [validated, completed, false],
    [validated, deleted, true],

    // included to...
    [included, registered, false],
    [included, validated, false],
    [included, included, false],
    [included, declined, true],
    [included, paused, true],
    [included, completed, true],
    [included, deleted, true],

    // completed to...
    [completed, registered, false],
    [completed, validated, false],
    [completed, included, true],
    [completed, declined, true],
    [completed, paused, false],
    [completed, completed, false],
    [completed, deleted, true],

    // paused to...
    [paused, registered, false],
    [paused, validated, false],
    [paused, included, true],
    [paused, declined, true],
    [paused, paused, false],
    [paused, completed, false],
    [paused, deleted, true],

    // declined to...
    [declined, registered, false],
    [declined, validated, false],
    [declined, included, true],
    [declined, declined, false],
    [declined, paused, false],
    [declined, completed, false],
    [declined, deleted, true],

    // deleted to...
    [deleted, registered, false],
    [deleted, validated, false],
    [deleted, included, false],
    [deleted, declined, false],
    [deleted, paused, false],
    [deleted, completed, false],
    [deleted, deleted, false],
  ])(`Change registration from "%s" to "%s"`, async (from, to, isValid) => {
    expect(StatusChangeHelper.isValidStatusChange(from, to)).toBe(isValid);
  });
});
