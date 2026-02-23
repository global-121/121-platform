import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { StatusChangeHelper } from '@121-service/src/registration/helpers/status-change.helper';

const {
  new: newStatus, // 'new' is a reserved keyword in JavaScript
  validated,
  included,
  completed,
  paused,
  declined,
  deleted,
} = RegistrationStatusEnum;

describe('isValidStatusChange', () => {
  test.concurrent.each([
    // new to...
    [newStatus, newStatus, false],
    [newStatus, included, true],
    [newStatus, validated, true],
    [newStatus, declined, true],
    [newStatus, paused, true],
    [newStatus, completed, false],
    [newStatus, deleted, true],

    // validated to...
    [validated, newStatus, false],
    [validated, validated, false],
    [validated, included, true],
    [validated, declined, true],
    [validated, paused, false],
    [validated, completed, false],
    [validated, deleted, true],

    // included to...
    [included, newStatus, false],
    [included, validated, false],
    [included, included, false],
    [included, declined, true],
    [included, paused, true],
    [included, completed, true],
    [included, deleted, true],

    // completed to...
    [completed, newStatus, false],
    [completed, validated, false],
    [completed, included, true],
    [completed, declined, true],
    [completed, paused, false],
    [completed, completed, false],
    [completed, deleted, true],

    // paused to...
    [paused, newStatus, false],
    [paused, validated, true],
    [paused, included, true],
    [paused, declined, true],
    [paused, paused, false],
    [paused, completed, false],
    [paused, deleted, true],

    // declined to...
    [declined, newStatus, false],
    [declined, validated, false],
    [declined, included, true],
    [declined, declined, false],
    [declined, paused, false],
    [declined, completed, false],
    [declined, deleted, true],

    // deleted to...
    [deleted, newStatus, false],
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
