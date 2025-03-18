import { GetEventDto } from '@121-service/src/events/dto/get-event.dto';
import { GetEventXlsxDto } from '@121-service/src/events/dto/get-event-xlsx.dto';
import { EventEntity } from '@121-service/src/events/entities/event.entity';
import { EventAttributeEntity } from '@121-service/src/events/entities/event-attribute.entity';

export class EventsMapper {
  static mapEventsToXlsxDtos(events: EventEntity[]): GetEventXlsxDto[] {
    return events.map((event) => this.mapEventToXlsxDto(event));
  }

  static mapEventsToJsonDtos(events: EventEntity[]): GetEventDto[] {
    return events.map((event) => this.mapEventToJsonDto(event));
  }

  # TODO make private
  static mapEventToXlsxDto(event: EventEntity): GetEventXlsxDto {
    const attributes = this.createAttributesObject(event.attributes);
    return {
      paId: event.registration.registrationProgramId,
      referenceId: event.registration.referenceId,
      changedAt: event.created,
      changedBy: event?.user?.username ? event?.user?.username : '',
      type: event.type,
      ...attributes,
    };
  }

  static mapEventToJsonDto(event: EventEntity): GetEventDto {
    const attributes = this.createAttributesObject(event.attributes);
    return {
      id: event.id,
      created: event.created,
      user:
        event.user && event.user.username && event.userId
          ? { id: event.userId, username: event.user.username }
          : null,
      registrationId: event.registrationId,
      type: event.type,
      attributes,
    };
  }

  private static createAttributesObject(
    attributes: EventAttributeEntity[],
  ): Record<string, EventAttributeEntity['value']> {
    const attributesObject: Record<string, EventAttributeEntity['value']> = {};
    for (const attribute of attributes) {
      if (attribute.value !== null) {
        attributesObject[attribute.key] = attribute.value;
      }
    }
    return attributesObject;
  }
}
