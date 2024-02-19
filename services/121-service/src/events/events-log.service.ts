import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistrationViewEntity } from '../registration/registration-view.entity';
import { ScopedUserRequest } from '../shared/middleware/scope-user.middleware';
import { EventAttributeEntity } from './entities/event-attribute.entity';
import { EventEntity } from './entities/event.entity';
import { EventEnum } from './event.enum';

@Injectable()
export class EventsLogService {
  @InjectRepository(EventEntity)
  private readonly eventRepository: Repository<EventEntity>;
  constructor(@Inject(REQUEST) private request: ScopedUserRequest) {}
  ß;

  public async log(
    oldRegistrationOrRegistrations:
      | RegistrationViewEntity
      | RegistrationViewEntity[],
    newRegistrationOrRegistrations:
      | RegistrationViewEntity
      | RegistrationViewEntity[],
    additionalAttributeObject?: Record<string, string>,
  ): Promise<void> {
    // Convert to array if not already
    const oldEntities = Array.isArray(oldRegistrationOrRegistrations)
      ? oldRegistrationOrRegistrations
      : [oldRegistrationOrRegistrations];
    const newEntities = Array.isArray(newRegistrationOrRegistrations)
      ? newRegistrationOrRegistrations
      : [newRegistrationOrRegistrations];

    this.validateEntities(oldEntities, newEntities);

    const allEventsForChange: EventEntity[] = this.createEventsForChanges(
      oldEntities,
      newEntities,
      this.request.userId,
    );

    const events = this.addAdditionalAttributesToEvents(
      allEventsForChange,
      additionalAttributeObject,
    );

    await this.eventRepository.save(events, { chunk: 2000 });
  }

  private addAdditionalAttributesToEvents(
    events: EventEntity[],
    additionalAttributeObject: Record<string, string>,
  ): EventEntity[] {
    if (!additionalAttributeObject) {
      return events;
    }
    for (const event of events) {
      for (const [key, value] of Object.entries(additionalAttributeObject)) {
        const attribute = new EventAttributeEntity();
        attribute.key = key;
        attribute.value = value;
        event.attributes.push(attribute);
      }
    }
    return events;
  }

  private validateEntities(
    oldEntities: RegistrationViewEntity[],
    newEntities: RegistrationViewEntity[],
  ): void {
    // check if oldEntities and newEntities are same length
    if (oldEntities.length !== newEntities.length) {
      throw new Error('Old and new Entities are not of the same length');
    }
    const oldIds = oldEntities.map((entity) => entity.id);
    const newIds = newEntities.map((entity) => entity.id);

    if (!this.arraysAreEqual(oldIds, newIds)) {
      throw new Error(`Old IDs: ${oldIds} and new IDs: ${newIds} do not match`);
    }
  }

  private arraysAreEqual<T>(array1: T[], array2: T[]): boolean {
    return (
      array1.length === array2.length &&
      array1.every((value, index) => value === array2[index])
    );
  }

  private createEventsForChanges(
    oldEntities: RegistrationViewEntity[],
    newEntities: RegistrationViewEntity[],
    userId: number,
  ): EventEntity[] {
    const allEventsForChange: EventEntity[] = [];
    for (let i = 0; i < oldEntities.length; i++) {
      const eventsPerRegistration = this.createEventsForEntityChanges(
        oldEntities[i],
        newEntities[i],
        userId,
      );
      allEventsForChange.push(...eventsPerRegistration);
    }
    return allEventsForChange;
  }

  private createEventsForEntityChanges(
    oldEntity: RegistrationViewEntity,
    newEntity: RegistrationViewEntity,
    userId: number,
  ): EventEntity[] {
    const keys = this.getRelevantRegistrationViewKeys(oldEntity, newEntity);

    const events: EventEntity[] = [];
    for (const key of keys) {
      if (oldEntity[key] !== newEntity[key]) {
        const eventForChange = this.createEventForChange(
          key,
          oldEntity[key],
          newEntity[key],
          oldEntity.id,
        );
        eventForChange.userId = userId;
        events.push(eventForChange);
      }
    }

    return events;
  }

  private createEventForChange(
    key: string,
    oldValue: string,
    newValue: string,
    registrationdId: number,
  ): EventEntity {
    const event = new EventEntity();
    event.type = this.getEventType(key);
    event.registrationId = registrationdId;
    event.attributes = this.getAttributesForChange(key, oldValue, newValue);
    return event;
  }

  private getAttributesForChange(
    key: string,
    oldValue: string,
    newValue: string,
  ): EventAttributeEntity[] {
    const eventAttributes: EventAttributeEntity[] = [];
    if (oldValue) {
      const attribute = this.createEventAttributeEntity('oldValue', oldValue);
      eventAttributes.push(attribute);
    }
    if (newValue) {
      const attribute = this.createEventAttributeEntity('newValue', newValue);
      eventAttributes.push(attribute);
    }
    if (key) {
      const attribute = this.createEventAttributeEntity('key', key);
      eventAttributes.push(attribute);
    }
    return eventAttributes;
  }

  private createEventAttributeEntity(
    key: string,
    value: string,
  ): EventAttributeEntity {
    const eventAttribute = new EventAttributeEntity();
    eventAttribute.key = key;
    eventAttribute.value = value;
    return eventAttribute;
  }

  private getRelevantRegistrationViewKeys(
    oldEntity: RegistrationViewEntity,
    newEntity: RegistrationViewEntity,
  ): string[] {
    const array1 = Object.keys(newEntity);
    const array2 = Object.keys(oldEntity);
    const mergedArray = [
      ...new Set([...array1, ...array2]),
    ] as (keyof RegistrationViewEntity)[];
    const irrelevantKeys: (keyof RegistrationViewEntity)[] = [
      'id',
      'paymentCount',
      'paymentCountRemaining',
      'programId',
      'registrationCreated',
      'registrationCreatedDate',
      'financialServiceProvider',
      'registrationProgramId',
      'personAffectedSequence',
      'lastMessageStatus',
      'inclusionScore',
      'status', // This should changed when we merge registrationStatusChanges with event
    ];
    return mergedArray.filter((key) => !irrelevantKeys.includes(key));
  }

  private getEventType(key: string): EventEnum {
    const financialServiceProviderKey: keyof RegistrationViewEntity =
      'fspDisplayNamePortal';
    if (key === financialServiceProviderKey) {
      return EventEnum.financialServiceProviderChange;
    }
    return EventEnum.registrationDataChange;
  }
}
