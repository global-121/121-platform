import { GetEventXlsxDto } from '../dto/get-event-xlsx.dto';
import { GetEventDto } from '../dto/get-event.dto';
import { EventAttributeEntity } from '../entities/event-attribute.entity';
import { EventEntity } from '../entities/event.entity';

export class EventsMapper {
  static mapEventsToXlsxDtos(events: EventEntity[]): GetEventXlsxDto[] {
    return events.map((event) => this.mapEventToXlsxDto(event));
  }

  static mapEventsToJsonDtos(events: EventEntity[]): GetEventDto[] {
    return events.map((event) => this.mapEventToJsonDto(event));
  }

  private static mapEventToXlsxDto(event: EventEntity): GetEventXlsxDto {
    const attributes = this.createAttributesObject(event.attributes);
    return {
      paId: event.registration.registrationProgramId,
      referenceId: event.registration.referenceId,
      changedAt: event.created,
      changedBy: event.user.username,
      type: event.type,
      ...attributes,
    };
  }

  private static mapEventToJsonDto(event: EventEntity): GetEventDto {
    const attributes = this.createAttributesObject(event.attributes);
    return {
      id: event.id,
      created: event.created,
      user: { id: event.userId, username: event.user.username },
      registrationId: event.registrationId,
      type: event.type,
      attributes: attributes,
    };
  }

  private static createAttributesObject(
    attributes: EventAttributeEntity[],
  ): Record<string, any> {
    const attributesObject: Record<string, string> = {};
    for (const attribute of attributes) {
      attributesObject[attribute.key] = attribute.value;
    }
    return attributesObject;
  }
}
