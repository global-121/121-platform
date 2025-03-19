import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

export class StatusChangeHelper {
  static isValidStatusChange(
    from: RegistrationStatusEnum,
    to: RegistrationStatusEnum,
  ): boolean {
    const {
      registered,
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
      [registered]: [included, validated, declined, deleted],
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
