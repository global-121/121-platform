import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

export class StatusChangeHelper {
  static isValidStatusChange(
    from: RegistrationStatusEnum,
    to: RegistrationStatusEnum,
  ): boolean {
    const {
      new: newStatus, // 'new' is a reserved keyword in JavaScript
      validated,
      included,
      completed,
      paused,
      declined,
      deleted,
    } = RegistrationStatusEnum;

    const validStatusChanges: Record<
      RegistrationStatusEnum,
      RegistrationStatusEnum[]
    > = {
      [newStatus]: [included, validated, declined, deleted, paused],
      [validated]: [included, declined, deleted],
      [included]: [completed, paused, declined, deleted],
      [completed]: [included, declined, deleted],
      [paused]: [included, declined, deleted],
      [declined]: [included, deleted],
      [deleted]: [],
    };
    return validStatusChanges[from].includes(to);
  }
}
