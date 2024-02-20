import { EventAttributeKeyEnum } from '../enum/event-attribute-key.enum';
import { EventEnum } from '../enum/event.enum';

export class ExportEventDto {
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
