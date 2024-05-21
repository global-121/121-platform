import { EventLogOptionsDto } from '@121-service/src/events/dto/event-log-options.dto';
import { EventSearchOptionsDto } from '@121-service/src/events/dto/event-search-options.dto';
import { GetEventXlsxDto } from '@121-service/src/events/dto/get-event-xlsx.dto';
import { GetEventDto } from '@121-service/src/events/dto/get-event.dto';
import { EventAttributeEntity } from '@121-service/src/events/entities/event-attribute.entity';
import { EventEntity } from '@121-service/src/events/entities/event.entity';
import { EventAttributeKeyEnum } from '@121-service/src/events/enum/event-attribute-key.enum';
import { EventEnum } from '@121-service/src/events/enum/event.enum';
import { EventsMapper } from '@121-service/src/events/utils/events.mapper';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { UserType } from '@121-service/src/user/user-type-enum';
import { UserService } from '@121-service/src/user/user.service';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { JOB_REF } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Job } from 'bull';
import { isMatch, isObject } from 'lodash';
import { Between } from 'typeorm';

@Injectable()
export class EventsService {
  constructor(
    @Inject(getScopedRepositoryProviderName(EventEntity))
    private eventScopedRepository: ScopedRepository<EventEntity>,
    @Inject(REQUEST) private request: ScopedUserRequest,
    @Inject(JOB_REF) private readonly jobRef: Job,
    private readonly userService: UserService,
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
      | Partial<RegistrationViewEntity>
      | Partial<RegistrationViewEntity>[],
    newRegistrationOrRegistrations:
      | Partial<RegistrationViewEntity>
      | Partial<RegistrationViewEntity>[],
    eventLogOptions?: EventLogOptionsDto,
  ): Promise<void> {
    // Convert to array if not already
    const oldEntities = Array.isArray(oldRegistrationOrRegistrations)
      ? oldRegistrationOrRegistrations
      : [oldRegistrationOrRegistrations];
    const newEntities = Array.isArray(newRegistrationOrRegistrations)
      ? newRegistrationOrRegistrations
      : [newRegistrationOrRegistrations];

    this.validateEntities(oldEntities, newEntities, eventLogOptions);
    // Get userId from request if it exists otherwise this update was done using a queue
    // than get it from the request of the job of the queue

    const requestUserId = this.request?.user?.['id']
      ? this.request?.user?.['id']
      : this.jobRef?.data?.request?.userId;

    let userIdToStore = null;
    if (requestUserId) {
      const user = await this.userService.findById(requestUserId);
      if (user && user.userType === UserType.aidWorker) {
        userIdToStore = requestUserId;
      }
    }

    // TODO: userIdToStore can be null, which causes an exception
    const allEventsForChange: EventEntity[] = this.createEventsForChanges(
      oldEntities,
      newEntities,
      userIdToStore,
      eventLogOptions?.registrationAttributes,
    );
    const events = this.addAdditionalAttributesToEvents(
      allEventsForChange,
      eventLogOptions?.additionalLogAttributes,
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
    oldEntities: Partial<RegistrationViewEntity>[],
    newEntities: Partial<RegistrationViewEntity>[],
    eventLogOptionsDto: EventLogOptionsDto,
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

    // Only check the fist entities for perfomance reasons.
    const firstOldEntity = oldEntities[0];
    const firstNewEntity = newEntities[0];
    const isFirstOldEntityRegistrationView =
      this.isCompleteRegistrationViewEntity(firstOldEntity);
    const isFirstNewEntityRegistrationView =
      this.isCompleteRegistrationViewEntity(firstNewEntity);

    // Check if one entity is RegistrationViewEntity and the other is not
    if (
      !eventLogOptionsDto?.registrationAttributes &&
      isFirstOldEntityRegistrationView !== isFirstNewEntityRegistrationView
    ) {
      throw new Error(
        'Old and new Entities are not of the same type. One is RegistrationViewEntity and the other is an (partial RegistrationViewEntity) object',
      );
    }

    // Check if both entities are not RegistrationViewEntity and registrationAttributes is not provided
    if (
      !isFirstOldEntityRegistrationView &&
      !isFirstNewEntityRegistrationView &&
      !eventLogOptionsDto?.registrationAttributes
    ) {
      throw new Error(
        'When using a partial RegistrationViewEntity, you need to provide the registrationAttributes in the eventLogOptionsDto.',
      );
    }
  }

  private isCompleteRegistrationViewEntity(
    obj: any,
  ): obj is RegistrationViewEntity {
    // Banal check if the object is a RegistrationViewEntity
    // This is to prevent that log is called with an object that is not a RegistrationViewEntity
    // While registrationAttributes is empty
    // Which would result in many faulty logs being created
    const requiredProperties: (keyof RegistrationViewEntity)[] = [
      'referenceId',
      'id',
      'status',
      'preferredLanguage',
    ];

    return requiredProperties.every((prop) => prop in obj);
  }

  private arraysAreEqual<T>(array1: T[], array2: T[]): boolean {
    return (
      array1.length === array2.length &&
      array1.every((value, index) => value === array2[index])
    );
  }

  private createEventsForChanges(
    oldEntities: Partial<RegistrationViewEntity>[],
    newEntities: Partial<RegistrationViewEntity>[],
    userId: number,
    registrationAttributes: string[],
  ): EventEntity[] {
    const allEventsForChange: EventEntity[] = [];
    for (let i = 0; i < oldEntities.length; i++) {
      const eventsPerRegistration = this.createEventsForEntityChanges(
        oldEntities[i],
        newEntities[i],
        userId,
        registrationAttributes,
      );
      allEventsForChange.push(...eventsPerRegistration);
    }
    return allEventsForChange;
  }

  private createEventsForEntityChanges(
    oldEntity: Partial<RegistrationViewEntity>,
    newEntity: Partial<RegistrationViewEntity>,
    userId: number,
    registeredAttributes: string[],
  ): EventEntity[] {
    let fieldNames = this.getRelevantRegistrationViewKeys(oldEntity, newEntity);

    // Filter out the keys that are not in the registeredAttributes
    if (registeredAttributes) {
      fieldNames = fieldNames.filter((key) =>
        registeredAttributes.includes(key),
      );
    }

    const events: EventEntity[] = [];
    for (const fieldName of fieldNames) {
      if (
        oldEntity[fieldName] === newEntity[fieldName] ||
        (isObject(oldEntity[fieldName]) &&
          isObject(newEntity[fieldName]) &&
          isMatch(oldEntity[fieldName], newEntity[fieldName]))
      ) {
        continue;
      }

      const eventForChange = this.createEventForChange(
        fieldName,
        oldEntity[fieldName],
        newEntity[fieldName],
        oldEntity.id,
      );
      eventForChange.userId = userId;
      events.push(eventForChange);
    }

    return events;
  }

  private createEventForChange(
    fieldName: string,
    oldValue: EventAttributeEntity['value'],
    newValue: EventAttributeEntity['value'],
    registrationdId: number,
  ): EventEntity {
    const event = new EventEntity();
    event.type = this.getEventType(fieldName);
    event.registrationId = registrationdId;

    const attributesData = {
      [EventAttributeKeyEnum.oldValue]: oldValue,
      [EventAttributeKeyEnum.newValue]: newValue,
    };
    if (event.type === EventEnum.registrationDataChange) {
      attributesData[EventAttributeKeyEnum.fieldName] = fieldName;
    }
    event.attributes = this.getAttributesForChange(attributesData);
    return event;
  }

  private getAttributesForChange(attributesData: {
    [key in EventAttributeKeyEnum]?: EventAttributeEntity['value'];
  }): EventAttributeEntity[] {
    return Object.entries(attributesData)
      .filter(([_, value]) => value)
      .map(([key, value]) =>
        this.createEventAttributeEntity(key as EventAttributeKeyEnum, value!),
      );
  }

  private createEventAttributeEntity(
    key: EventAttributeKeyEnum,
    value: EventAttributeEntity['value'],
  ): EventAttributeEntity {
    const eventAttribute = new EventAttributeEntity();
    eventAttribute.key = key;
    eventAttribute.value = value;
    return eventAttribute;
  }

  private getRelevantRegistrationViewKeys(
    oldEntity: Partial<RegistrationViewEntity>,
    newEntity: Partial<RegistrationViewEntity>,
  ): string[] {
    const array1 = Object.keys(newEntity);
    const array2 = Object.keys(oldEntity);
    const mergedArray = [
      ...new Set([...array1, ...array2]),
    ] as (keyof RegistrationViewEntity)[];
    const irrelevantKeys: (keyof RegistrationViewEntity | 'name')[] = [
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
      'name',
      'inclusionScore',
    ];
    return mergedArray.filter((key) => !irrelevantKeys.includes(key));
  }

  private getEventType(key: string): EventEnum {
    const financialServiceProviderKey: keyof RegistrationViewEntity =
      'fspDisplayName';
    if (key === financialServiceProviderKey) {
      return EventEnum.financialServiceProviderChange;
    }
    const statusKey: keyof RegistrationViewEntity = 'status';
    if (key === statusKey) {
      return EventEnum.registrationStatusChange;
    }
    return EventEnum.registrationDataChange;
  }
}
