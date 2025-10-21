import { GetRegistrationEventDto } from '@121-service/src/registration-events/dto/get-registration-event.dto';
import { GetRegistrationEventXlsxDto } from '@121-service/src/registration-events/dto/get-registration-event-xlsx.dto';
import { RegistrationEventEntity } from '@121-service/src/registration-events/entities/registration-event.entity';
import { RegistrationEventAttributeEntity } from '@121-service/src/registration-events/entities/registration-event-attribute.entity';

export class RegistrationEventsMapper {
  static mapEventsToXlsxDtos(
    events: RegistrationEventEntity[],
  ): GetRegistrationEventXlsxDto[] {
    return events.map((event: any) => this.mapEventToXlsxDto(event));
  }

  static mapEventsToJsonDtos(
    events: RegistrationEventEntity[],
  ): GetRegistrationEventDto[] {
    return events.map((event: any) => this.mapEventToJsonDto(event));
  }

  static mapEventToXlsxDto(
    event: RegistrationEventEntity,
  ): GetRegistrationEventXlsxDto {
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

  static mapEventToJsonDto(
    event: RegistrationEventEntity,
  ): GetRegistrationEventDto {
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
    attributes: RegistrationEventAttributeEntity[],
  ): Record<string, (RegistrationEventAttributeEntity as any)['value']> {
    // sort attribute to make sure the order is always the same
    // this is important for testing purposes but also not bad as a feature
    const attributesSorted = [...attributes].sort((a, b) =>
      a.key.localeCompare(b.key),
    );
    const attributesObject: Record<
      string,
      (RegistrationEventAttributeEntity as any)['value']
    > = {};
    for (const attribute of attributesSorted) {
      if (attribute.value !== null) {
        attributesObject[attribute.key] = attribute.value;
      }
    }
    return attributesObject;
  }
}
