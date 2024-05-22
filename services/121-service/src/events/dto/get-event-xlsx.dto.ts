import { EventAttributeKeyEnum } from '@121-service/src/events/enum/event-attribute-key.enum';
import { EventEnum } from '@121-service/src/events/enum/event.enum';

export class GetEventXlsxDto {
  paId: number;
  referenceId: string;
  type: EventEnum;
  changedBy: string;
  changedAt: Date;

  [EventAttributeKeyEnum.reason]?: string;
  [EventAttributeKeyEnum.oldValue]?: string;
  [EventAttributeKeyEnum.newValue]?: string;
  [EventAttributeKeyEnum.fieldName]?: string;
}
