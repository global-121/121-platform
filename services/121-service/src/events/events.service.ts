import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Between } from 'typeorm';
import { RegistrationViewEntity } from '../registration/registration-view.entity';
import { ScopedRepository } from '../scoped.repository';
import { ScopedUserRequest } from '../shared/middleware/scope-user.middleware';
import { getScopedRepositoryProviderName } from '../utils/scope/createScopedRepositoryProvider.helper';
import { EventSearchOptionsDto } from './dto/event-search-options.dto';
import { GetEventXlsxDto } from './dto/get-event-xlsx.dto';
import { GetEventDto } from './dto/get-event.dto';
import { EventAttributeEntity } from './entities/event-attribute.entity';
import { EventEntity } from './entities/event.entity';
import { EventAttributeKeyEnum } from './enum/event-attribute-key.enum';
import { EventEnum } from './enum/event.enum';
import { EventsMapper } from './utils/events.mapper';

@Injectable()
export class EventsService {
  constructor(
    @Inject(getScopedRepositoryProviderName(EventEntity))
    private eventScopedRepository: ScopedRepository<EventEntity>,
    @Inject(REQUEST) private request: ScopedUserRequest,
  ) {}

  public async getEventsJsonDto(
    programId: number,
    searchOptions: EventSearchOptionsDto,
  ): Promise<GetEventDto[]> {
    const events = await this.fetchEvents(programId, searchOptions);
    return EventsMapper.mapEventsToJsonDtos(events);
  }

  public async getEventsXlsxDto(
    programId: number,
    searchOptions: EventSearchOptionsDto,
  ): Promise<GetEventXlsxDto[]> {
    const events = await this.fetchEvents(programId, searchOptions);
    return EventsMapper.mapEventsToXlsxDtos(events);
  }

  private async fetchEvents(
    programId: number,
    searchOptions: EventSearchOptionsDto,
  ): Promise<EventEntity[]> {
    const exportLimit = 100000;
    const events = await this.eventScopedRepository.find({
      where: this.createWhereClause(programId, searchOptions),
      relations: ['registration', 'user', 'attributes'],
      order: { created: 'DESC', attributes: { key: 'ASC' } }, // This order by attributes.key makes use of the fact that the alphabetical ordering of the possible enum-values happens to be the correct order. This is not very robust.
      take: exportLimit,
    });
    return events;
  }

  private createWhereClause(
    programId: number,
    searchOptions: EventSearchOptionsDto,
  ): object {
    const { registrationId, queryParams } = searchOptions;
    const whereStatement = {
      registration: {
        programId: programId,
      },
    };
    if (registrationId) {
      whereStatement['registration']['id'] = registrationId;
    }
    if (queryParams) {
      if (queryParams['referenceId']) {
        whereStatement['registration']['referenceId'] =
          queryParams['referenceId'];
      }
      whereStatement['created'] = Between(
        queryParams['fromDate'] || new Date(2000, 1, 1),
        queryParams['toDate'] || new Date(),
      );
    }
    return whereStatement;
  }

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
      this.request.user['id'],
    );

    const events = this.addAdditionalAttributesToEvents(
      allEventsForChange,
      additionalAttributeObject,
    );

    await this.eventScopedRepository.save(events, { chunk: 2000 });
  }

  private addAdditionalAttributesToEvents(
    events: EventEntity[],
    additionalAttributeObject: Record<EventAttributeKeyEnum, string>,
  ): EventEntity[] {
    if (!additionalAttributeObject) {
      return events;
    }
    for (const event of events) {
      for (const [key, value] of Object.entries(additionalAttributeObject)) {
        const attribute = new EventAttributeEntity();
        attribute.key = key as EventAttributeKeyEnum;
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
      const attribute = this.createEventAttributeEntity(
        EventAttributeKeyEnum.oldValue,
        oldValue,
      );
      eventAttributes.push(attribute);
    }
    if (newValue) {
      const attribute = this.createEventAttributeEntity(
        EventAttributeKeyEnum.newValue,
        newValue,
      );
      eventAttributes.push(attribute);
    }
    if (key) {
      const attribute = this.createEventAttributeEntity(
        EventAttributeKeyEnum.fieldName,
        key,
      );
      eventAttributes.push(attribute);
    }
    return eventAttributes;
  }

  private createEventAttributeEntity(
    key: EventAttributeKeyEnum,
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
