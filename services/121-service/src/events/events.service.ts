import { JOB_REF } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Job } from 'bull';
import { isMatch, isObject } from 'lodash';

import { EventSearchOptionsDto } from '@121-service/src/events/dto/event-search-options.dto';
import { GetEventDto } from '@121-service/src/events/dto/get-event.dto';
import { GetEventXlsxDto } from '@121-service/src/events/dto/get-event-xlsx.dto';
import { EventEntity } from '@121-service/src/events/entities/event.entity';
import { EventAttributeEntity } from '@121-service/src/events/entities/event-attribute.entity';
import { EventEnum } from '@121-service/src/events/enum/event.enum';
import { EventAttributeKeyEnum } from '@121-service/src/events/enum/event-attribute-key.enum';
import { EventScopedRepository } from '@121-service/src/events/event.repository';
import { CreateForIgnoredDuplicateRegistrationPair } from '@121-service/src/events/interfaces/create-for-ignored-duplicate-registration-pair.interface';
import { createFromRegistrationViewsOptions } from '@121-service/src/events/interfaces/create-from-registration-views-options.interface';
import { RegistrationIdentifiers } from '@121-service/src/events/interfaces/registration-identifiers.interface';
import { ValueExtractor } from '@121-service/src/events/utils/events.helpers';
import { EventsMapper } from '@121-service/src/events/utils/events.mapper';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { UserService } from '@121-service/src/user/user.service';
import { UserType } from '@121-service/src/user/user-type-enum';

// Define an interface that can contain any attribute of RegistrationViewEntity, but make sure at least id is in.
interface RegistrationViewWithId extends Partial<RegistrationViewEntity> {
  id: number;
}

@Injectable()
export class EventsService {
  constructor(
    private eventRepository: EventScopedRepository,
    @Inject(REQUEST) private request: ScopedUserRequest,
    @Inject(JOB_REF) private readonly jobRef: Job,
    private readonly userService: UserService,
  ) {}

  public async getEventsAsJson({
    programId,
    searchOptions,
  }: {
    programId: number;
    searchOptions: EventSearchOptionsDto;
  }): Promise<GetEventDto[]> {
    const events = await this.fetchEvents(programId, searchOptions);
    return EventsMapper.mapEventsToJsonDtos(events);
  }

  public async getEventsAsXlsx({
    programId,
    searchOptions,
  }: {
    programId: number;
    searchOptions: EventSearchOptionsDto;
  }): Promise<GetEventXlsxDto[]> {
    const events = await this.fetchEvents(programId, searchOptions);
    return EventsMapper.mapEventsToXlsxDtos(events);
  }

  private async fetchEvents(
    programId: number,
    searchOptions: EventSearchOptionsDto,
  ): Promise<EventEntity[]> {
    return await this.eventRepository.getManyByProgramIdAndSearchOptions(
      programId,
      searchOptions,
    );
  }

  /**
   * Create events by looking the changed in property values between old and new registration view entities.
   *
   * @param {RegistrationViewWithId | RegistrationViewWithId[]} oldRegistrationViews - The old registration view entity or entities before the change.
   * @param {RegistrationViewWithId | RegistrationViewWithId[]} newRegistrationViews - The new registration view entity or entities after the change.
   * @param {createFromRegistrationViewsOptions} [createEventOptions] - Optional event creation options to specify additional attributes and registration properties to log.
   * @returns {Promise<void>}
   *
   * @example
   * // Single registration change
   * const oldRegistrationView = { id: 1, name: 'Old Name' };
   * const newRegistrationView = { id: 1, name: 'New Name' };
   * await createFromRegistrationViews(oldRegistrationView, newRegistrationView);
   *
   * @example
   * // Multiple registrations change
   * const oldRegistrationViews = [
   *   { id: 1, name: 'Old Name 1' },
   *   { id: 2, name: 'Old Name 2' },
   * ];
   * const newRegistrationViews = [
   *   { id: 1, name: 'New Name 1' },
   *   { id: 2, name: 'New Name 2' },
   * ];
   * await createFromRegistrationViews(oldRegistrationViews, newRegistrationViews);
   *
   * @example
   * // With event creation options
   * const oldRegistrationView = { id: 1, name: 'Old Name' };
   * const newRegistrationView = { id: 1, name: 'New Name' };
   * const eventCreateOptions = {
   *   explicitRegistrationPropertyNames: ['name'],
   *   reason: 'Name change',
   * };
   * await createFromRegistrationViews(oldRegistrationView, newRegistrationView, eventCreateOptions);
   */
  public async createFromRegistrationViews(
    oldRegistrationViews: RegistrationViewWithId | RegistrationViewWithId[],
    newRegistrationViews: RegistrationViewWithId | RegistrationViewWithId[],
    createEventOptions?: createFromRegistrationViewsOptions,
  ): Promise<void> {
    // Convert to array if not already
    const oldEntities = Array.isArray(oldRegistrationViews)
      ? oldRegistrationViews
      : [oldRegistrationViews];
    const newEntities = Array.isArray(newRegistrationViews)
      ? newRegistrationViews
      : [newRegistrationViews];

    this.validateEntities(oldEntities, newEntities, createEventOptions);
    // Get userId from request if it exists otherwise this update was done using a queue
    // than get it from the request of the job of the queue

    const requestUserId: number = this.request?.user?.['id']
      ? this.request?.user?.['id']
      : this.jobRef?.data?.request?.userId;

    // UserId can be null if the registration change was done by a system user, for example when the system puts a registration to status complete
    let userIdToStore: number | undefined = undefined;
    if (requestUserId) {
      const user = await this.userService.findById(requestUserId);
      if (user && user.userType === UserType.aidWorker) {
        userIdToStore = requestUserId;
      }
    }

    const events = this.createEventsForChanges(
      oldEntities,
      newEntities,
      userIdToStore,
      createEventOptions?.explicitRegistrationPropertyNames,
    );

    if (createEventOptions?.reason) {
      for (const event of events) {
        const reasonAttribute = this.createEventAttributeForReason(
          createEventOptions?.reason,
        );
        event.attributes.push(reasonAttribute);
      }
    }

    await this.eventRepository.save(events, { chunk: 2000 });
  }

  private createEventAttributeForReason(reason: string): EventAttributeEntity {
    const attribute = new EventAttributeEntity();
    attribute.key = EventAttributeKeyEnum.reason;
    attribute.value = reason;
    return attribute;
  }

  private validateEntities(
    oldEntities: RegistrationViewWithId[],
    newEntities: RegistrationViewWithId[],
    eventLogOptionsDto?: createFromRegistrationViewsOptions,
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
      !eventLogOptionsDto?.explicitRegistrationPropertyNames &&
      isFirstOldEntityRegistrationView !== isFirstNewEntityRegistrationView
    ) {
      throw new Error(
        'Old and new Entities are not of the same type. One is RegistrationViewEntity and the other is an (partial RegistrationViewEntity) object',
      );
    }

    // Check if both entities are not RegistrationViewEntity and explicitRegistrationAttributes is not provided
    if (
      !isFirstOldEntityRegistrationView &&
      !isFirstNewEntityRegistrationView &&
      !eventLogOptionsDto?.explicitRegistrationPropertyNames
    ) {
      throw new Error(
        'When using a partial RegistrationViewEntity, you need to provide the registrationAttributes in the eventLogOptionsDto.',
      );
    }
  }

  private isCompleteRegistrationViewEntity(
    obj: unknown,
  ): obj is RegistrationViewEntity {
    // Ensure obj is a non-null object
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

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
    oldEntities: RegistrationViewWithId[],
    newEntities: RegistrationViewWithId[],
    userId?: number,
    registrationAttributes?: string[],
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
    oldEntity: RegistrationViewWithId,
    newEntity: RegistrationViewWithId,
    userId?: number,
    registeredAttributes?: string[],
  ): EventEntity[] {
    let fieldNames = this.getRelevantRegistrationViewKeys(oldEntity, newEntity);

    // Filter out the keys that are not in the registeredAttributes
    if (registeredAttributes) {
      fieldNames = fieldNames.filter((key) =>
        registeredAttributes.includes(key as string),
      );
    }

    const events: EventEntity[] = [];
    for (const key of fieldNames) {
      if (
        oldEntity[key] === newEntity[key] ||
        (isObject(oldEntity[key]) &&
          isObject(newEntity[key]) &&
          isMatch(oldEntity[key], newEntity[key]))
      ) {
        continue;
      }

      const oldValue = ValueExtractor.getValue(oldEntity[key]);
      const newValue = ValueExtractor.getValue(newEntity[key]);

      const eventForChange = this.createEventForChange(
        key,
        oldValue,
        newValue,
        oldEntity.id,
      );
      eventForChange.userId = userId ?? null;
      events.push(eventForChange);
    }

    return events;
  }

  private createEventForChange(
    fieldName: string,
    oldValue: EventAttributeEntity['value'],
    newValue: EventAttributeEntity['value'],
    registrationId: number,
  ): EventEntity {
    const event = new EventEntity();
    event.type = this.getEventType(fieldName);
    event.registrationId = registrationId;

    // Explicitly declare attributesData as Record<string, unknown> to allow dynamic keys
    const attributesData: Record<string, unknown> = {
      [EventAttributeKeyEnum.oldValue]: oldValue,
      [EventAttributeKeyEnum.newValue]: newValue,
    };
    if (event.type === EventEnum.registrationDataChange) {
      attributesData[EventAttributeKeyEnum.fieldName] = fieldName;
    }
    event.attributes = this.getAttributesForChange(attributesData);
    return event;
  }

  private getAttributesForChange(
    attributesData: Partial<
      Record<EventAttributeKeyEnum, EventAttributeEntity['value']>
    >,
  ): EventAttributeEntity[] {
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
    oldEntity: RegistrationViewWithId,
    newEntity: RegistrationViewWithId,
  ): (keyof RegistrationViewWithId)[] {
    const array1 = Object.keys(newEntity) as (keyof RegistrationViewWithId)[];
    const array2 = Object.keys(oldEntity) as (keyof RegistrationViewWithId)[];

    // Merge and remove duplicates by creating a Set and converting it back to an array
    const mergedArray = Array.from(new Set([...array1, ...array2]));

    // List of irrelevant keys
    // TODO: Explain why 'name' property is exception.
    const irrelevantKeys: (keyof RegistrationViewWithId | 'name')[] = [
      'id',
      'paymentCount',
      'paymentCountRemaining',
      'programId',
      'registrationCreated',
      'registrationCreatedDate',
      'financialServiceProviderName',
      'programFinancialServiceProviderConfigurationId',
      'programFinancialServiceProviderConfigurationLabel',
      'registrationProgramId',
      'personAffectedSequence',
      'lastMessageStatus',
      'name',
      'inclusionScore',
    ];

    // Filter out irrelevant keys
    return mergedArray.filter((key) => !irrelevantKeys.includes(key));
  }

  private getEventType(key: string): EventEnum {
    const financialServiceProviderKey: keyof RegistrationViewEntity =
      'programFinancialServiceProviderConfigurationName';
    if (key === financialServiceProviderKey) {
      return EventEnum.financialServiceProviderChange;
    }
    const statusKey: keyof RegistrationViewEntity = 'status';
    if (key === statusKey) {
      return EventEnum.registrationStatusChange;
    }
    return EventEnum.registrationDataChange;
  }

  public async createForIgnoredDuplicateRegistrationPair(
    input: CreateForIgnoredDuplicateRegistrationPair,
  ): Promise<void> {
    const event1 = this.createSingleIgnoredDuplicateEvent({
      registrationId: input.registration1.id,
      duplicateRegistration: input.registration2,
      reason: input.reason,
    });
    const event2 = this.createSingleIgnoredDuplicateEvent({
      registrationId: input.registration2.id,
      duplicateRegistration: input.registration1,
      reason: input.reason,
    });
    await this.eventRepository.save([event1, event2]);
  }

  private createSingleIgnoredDuplicateEvent({
    registrationId,
    duplicateRegistration,
    reason,
  }: {
    registrationId: number;
    duplicateRegistration: RegistrationIdentifiers;
    reason: string;
  }): EventEntity {
    const event = new EventEntity();
    event.type = EventEnum.ignoredDuplication;
    event.registrationId = registrationId;
    event.attributes = this.createIgnoredDuplicateEventAttributes({
      duplicateRegistration,
      reason,
    });
    event.userId = this.request.user?.id ?? null;
    return event;
  }

  private createIgnoredDuplicateEventAttributes({
    duplicateRegistration,
    reason,
  }: {
    duplicateRegistration: RegistrationIdentifiers;
    reason: string;
  }): EventAttributeEntity[] {
    return [
      this.createEventAttributeEntity(
        EventAttributeKeyEnum.duplicateRegistrationId,
        String(duplicateRegistration.id),
      ),
      this.createEventAttributeEntity(
        EventAttributeKeyEnum.duplicateRegistrationProgramId,
        String(duplicateRegistration.registrationProgramId),
      ),
      this.createEventAttributeForReason(reason),
    ];
  }
}
