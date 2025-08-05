import { RegistrationEventEnum } from '@121-service/src/registration-events/enum/registration-event.enum';
import { RegistrationEventAttributeKeyEnum } from '@121-service/src/registration-events/enum/registration-event-attribute-key.enum';

export class GetRegistrationEventXlsxDto {
  paId: number;
  referenceId: string;
  type: RegistrationEventEnum;
  changedBy: string;
  changedAt: Date;

  [RegistrationEventAttributeKeyEnum.reason]?: string;
  [RegistrationEventAttributeKeyEnum.oldValue]?: string;
  [RegistrationEventAttributeKeyEnum.newValue]?: string;
  [RegistrationEventAttributeKeyEnum.fieldName]?: string;
}
