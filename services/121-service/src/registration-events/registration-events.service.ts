import { JOB_REF } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Job } from 'bull';
import { isEqual, isMatch, isObject } from 'lodash';
import { paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { SelectQueryBuilder } from 'typeorm';

import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { PaginateConfigRegistrationEventView } from '@121-service/src/registration-events/const/paginate-config-registration-event-view.const';
import { FindAllRegistrationEventsResultDto } from '@121-service/src/registration-events/dto/find-all-registration-events-result.dto';
import { PaginatedRegistrationEventDto } from '@121-service/src/registration-events/dto/paginated-registration-events.dto';
import { RegistrationEventSearchOptionsDto } from '@121-service/src/registration-events/dto/registration-event-search-options.dto';
import { RegistrationEventEntity } from '@121-service/src/registration-events/entities/registration-event.entity';
import { RegistrationEventViewEntity } from '@121-service/src/registration-events/entities/registration-event.view.entity';
import { RegistrationEventAttributeEntity } from '@121-service/src/registration-events/entities/registration-event-attribute.entity';
import { RegistrationEventEnum } from '@121-service/src/registration-events/enum/registration-event.enum';
import { RegistrationEventAttributeKeyEnum } from '@121-service/src/registration-events/enum/registration-event-attribute-key.enum';
import { CreateForIgnoredDuplicatePair } from '@121-service/src/registration-events/interfaces/create-for-ignored-duplicate-pair.interface';
import { createFromRegistrationViewsOptions } from '@121-service/src/registration-events/interfaces/create-from-registration-views-options.interface';
import { RegistrationIdentifiers } from '@121-service/src/registration-events/interfaces/registration-identifiers.interface';
import { RegistrationEventViewScopedRepository } from '@121-service/src/registration-events/repositories/registration-event.view.repository';
import { ValueExtractor } from '@121-service/src/registration-events/utils/registration-events.helpers';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { UserType } from '@121-service/src/user/enum/user-type-enum';
import { UserService } from '@121-service/src/user/user.service';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

// Define an interface that can contain any attribute of RegistrationViewEntity, but make sure at least id is in.
interface RegistrationViewWithId extends Partial<RegistrationViewEntity> {
  id: number;
}

@Injectable()
export class RegistrationEventsService {
  @Inject(getScopedRepositoryProviderName(RegistrationEventEntity))
  private registrationEventRepository: ScopedRepository<RegistrationEventEntity>;
  constructor(
    @Inject(REQUEST) private request: ScopedUserRequest,
    @Inject(JOB_REF) private readonly jobRef: Job,
    private readonly userService: UserService,
    private readonly registrationEventViewScopedRepository: RegistrationEventViewScopedRepository,
  ) {}

  public getRegistrationEventsByRegistrationId({
    programId,
    registrationId,
  }: {
    programId: number;
    registrationId: number;
  }): Promise<FindAllRegistrationEventsResultDto> {
    const searchOptions: RegistrationEventSearchOptionsDto = {
      registrationId,
    };
    const queryBuilder =
      this.registrationEventViewScopedRepository.createQueryBuilderWithSearchOptionsAndSelect(
        {
          programId,
          searchOptions,
        },
      );

    const paginateQuery = {} as PaginateQuery;
    return this.getPaginatedRegistrationEvents({
      paginateQuery,
      queryBuilder,
    });
  }

  public getRegistrationEventsExport({
    programId,
    searchOptions,
  }: {
    programId: number;
    searchOptions: RegistrationEventSearchOptionsDto;
  }): Promise<FindAllRegistrationEventsResultDto> {
    const select: (keyof RegistrationEventViewEntity)[] = [
      'id',
      'registrationProgramId',
      'type',
      'fieldChanged',
      'oldValue',
      'newValue',
      'reason',
      'username',
      'created',
    ];
    const queryBuilder =
      this.registrationEventViewScopedRepository.createQueryBuilderWithSearchOptionsAndSelect(
        {
          programId,
          searchOptions,
          select,
        },
      );

    const exportLimit = 500_000;
    const paginateQuery = {
      limit: exportLimit,
    } as PaginateQuery;
    return this.getPaginatedRegistrationEvents({
      paginateQuery,
      queryBuilder,
    });
  }

  public async getRegistrationEventsMonitoring({
    programId,
    paginateQuery,
  }: {
    programId: number;
    paginateQuery: PaginateQuery;
  }): Promise<FindAllRegistrationEventsResultDto> {
    const queryBuilder =
      this.registrationEventViewScopedRepository.createQueryBuilderExcludingStatusChanges(
        programId,
      );

    return this.getPaginatedRegistrationEvents({
      paginateQuery,
      queryBuilder,
    });
  }

  private async getPaginatedRegistrationEvents({
    paginateQuery,
    queryBuilder,
  }: {
    paginateQuery: PaginateQuery;
    queryBuilder: SelectQueryBuilder<RegistrationEventViewEntity>;
  }): Promise<FindAllRegistrationEventsResultDto> {
    const result = await paginate<RegistrationEventViewEntity>(
      paginateQuery,
      queryBuilder,
      {
        ...PaginateConfigRegistrationEventView,
      },
    );

    return result as Paginated<PaginatedRegistrationEventDto>; // This type-conversion is done to make our frontend happy as it cannot deal with typeorm entities
  }

  /**
   * Create events by looking for the changes in property-values between old- and new RegistrationViewEntities.
   *
   * @param {RegistrationViewWithId | RegistrationViewWithId[]} oldRegistrationViews - The old registration view entity or entities before the change.
   * @param {RegistrationViewWithId | RegistrationViewWithId[]} newRegistrationViews - The new registration view entity or entities after the change.
   * @param {createFromRegistrationViewsOptions} [createRegistrationEventOptions] - Optional registration event creation options to specify additional attributes and registration properties to log.
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
   * // With registration event creation options
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
    createRegistrationEventOptions?: createFromRegistrationViewsOptions,
  ): Promise<void> {
    const oldEntities = Array.isArray(oldRegistrationViews)
      ? oldRegistrationViews
      : [oldRegistrationViews];
    const newEntities = Array.isArray(newRegistrationViews)
      ? newRegistrationViews
      : [newRegistrationViews];

    this.validateEntities(
      oldEntities,
      newEntities,
      createRegistrationEventOptions,
    );

    // Get userId from request if it exists otherwise this update was done using a queue than get it from the request of the job of the queue
    const requestUserId: number = this.request?.user?.['id']
      ? this.request.user['id']
      : this.jobRef?.data?.request?.userId;

    // UserId can be null if the registration change was done by a system user, for example when the system puts a registration to status complete
    let userIdToStore: number | undefined = undefined;
    if (requestUserId) {
      const user = await this.userService.findById(requestUserId);
      if (user && user.userType === UserType.aidWorker) {
        userIdToStore = requestUserId;
      }
    }

    const registrationEvents = this.createEventsForChanges(
      oldEntities,
      newEntities,
      userIdToStore,
      createRegistrationEventOptions?.explicitRegistrationPropertyNames,
    );

    if (createRegistrationEventOptions?.reason) {
      for (const event of registrationEvents) {
        const reasonAttribute = this.createEventAttributeForReason(
          createRegistrationEventOptions?.reason,
        );
        event.attributes.push(reasonAttribute);
      }
    }

    await this.registrationEventRepository.save(registrationEvents, {
      chunk: 2000,
    });
  }

  private createEventAttributeForReason(
    reason: string,
  ): RegistrationEventAttributeEntity {
    const attribute = new RegistrationEventAttributeEntity();
    attribute.key = RegistrationEventAttributeKeyEnum.reason;
    attribute.value = reason;
    return attribute;
  }

  private validateEntities(
    oldEntities: RegistrationViewWithId[],
    newEntities: RegistrationViewWithId[],
    eventLogOptionsDto?: createFromRegistrationViewsOptions,
  ): void {
    const oldIds = oldEntities.map((entity) => entity.id);
    const newIds = newEntities.map((entity) => entity.id);

    if (!isEqual(oldIds.sort(), newIds.sort())) {
      throw new Error(
        `Old IDs: ${oldIds} and new IDs: ${newIds} do not match. These are the entities that are being compared:
        oldEntities:
        ${JSON.stringify(oldEntities ?? {}, null, 2)}
        newEntities:
        ${JSON.stringify(newEntities ?? {}, null, 2)}
        eventLogOptionsDto:
        ${JSON.stringify(eventLogOptionsDto ?? {}, null, 2)}`,
      );
    }

    // Only check the fist entities for performance reasons.
    const firstOldEntity = oldEntities[0];
    const firstNewEntity = newEntities[0];
    const isFirstOldEntityRegistrationView =
      this.isCompleteRegistrationViewEntity(firstOldEntity);
    const isFirstNewEntityRegistrationView =
      this.isCompleteRegistrationViewEntity(firstNewEntity);

    if (
      !eventLogOptionsDto?.explicitRegistrationPropertyNames &&
      isFirstOldEntityRegistrationView !== isFirstNewEntityRegistrationView
    ) {
      throw new Error(
        'Old and new Entities are not of the same type. One is RegistrationViewEntity and the other is an (partial RegistrationViewEntity) object',
      );
    }

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

  private createEventsForChanges(
    oldEntities: RegistrationViewWithId[],
    newEntities: RegistrationViewWithId[],
    userId?: number,
    registrationAttributes?: string[],
  ): RegistrationEventEntity[] {
    const allEventsForChange: RegistrationEventEntity[] = [];
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
  ): RegistrationEventEntity[] {
    let fieldNames = this.getRelevantRegistrationViewKeys(oldEntity, newEntity);

    // Filter out the keys that are not in the registeredAttributes
    if (registeredAttributes) {
      fieldNames = fieldNames.filter((key) =>
        registeredAttributes.includes(key as string),
      );
    }

    const events: RegistrationEventEntity[] = [];
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
    oldValue: RegistrationEventAttributeEntity['value'],
    newValue: RegistrationEventAttributeEntity['value'],
    registrationId: number,
  ): RegistrationEventEntity {
    const event = new RegistrationEventEntity();
    event.type = this.getEventType(fieldName);
    event.registrationId = registrationId;

    // Explicitly declare attributesData as Record<string, unknown> to allow dynamic keys
    const attributesData: Record<string, unknown> = {
      [RegistrationEventAttributeKeyEnum.oldValue]: oldValue,
      [RegistrationEventAttributeKeyEnum.newValue]: newValue,
    };
    attributesData[RegistrationEventAttributeKeyEnum.fieldName] = fieldName;
    event.attributes = this.getAttributesForChange(attributesData);
    return event;
  }

  private getAttributesForChange(
    attributesData: Partial<
      Record<
        RegistrationEventAttributeKeyEnum,
        RegistrationEventAttributeEntity['value']
      >
    >,
  ): RegistrationEventAttributeEntity[] {
    return Object.entries(attributesData)
      .filter(([_, value]) => value)
      .map(([key, value]) =>
        this.createEventAttributeEntity(
          key as RegistrationEventAttributeKeyEnum,
          value!,
        ),
      );
  }

  private createEventAttributeEntity(
    key: RegistrationEventAttributeKeyEnum,
    value: RegistrationEventAttributeEntity['value'],
  ): RegistrationEventAttributeEntity {
    const eventAttribute = new RegistrationEventAttributeEntity();
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
      'created',
      'fspName',
      'programFspConfigurationId',
      'programFspConfigurationLabel',
      'registrationProgramId',
      'personAffectedSequence',
      'lastMessageStatus',
      'name',
      'inclusionScore',
    ];

    // Filter out irrelevant keys
    return mergedArray.filter((key) => !irrelevantKeys.includes(key));
  }

  private getEventType(key: string): RegistrationEventEnum {
    const fspKey: keyof RegistrationViewEntity = 'programFspConfigurationName';
    if (key === fspKey) {
      return RegistrationEventEnum.fspChange;
    }
    const statusKey: keyof RegistrationViewEntity = 'status';
    if (key === statusKey) {
      return RegistrationEventEnum.registrationStatusChange;
    }
    return RegistrationEventEnum.registrationDataChange;
  }

  public async createForIgnoredDuplicatePair(
    input: CreateForIgnoredDuplicatePair,
  ): Promise<void> {
    const event1 = this.createIgnoredDuplicateEvent({
      registrationId: input.registration1.id,
      duplicateRegistration: input.registration2,
      reason: input.reason,
    });
    const event2 = this.createIgnoredDuplicateEvent({
      registrationId: input.registration2.id,
      duplicateRegistration: input.registration1,
      reason: input.reason,
    });
    await this.registrationEventRepository.save([event1, event2]);
  }

  private createIgnoredDuplicateEvent({
    registrationId,
    duplicateRegistration,
    reason,
  }: {
    registrationId: number;
    duplicateRegistration: RegistrationIdentifiers;
    reason: string;
  }): RegistrationEventEntity {
    const event = new RegistrationEventEntity();
    event.type = RegistrationEventEnum.ignoredDuplicate;
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
  }): RegistrationEventAttributeEntity[] {
    return [
      this.createEventAttributeEntity(
        RegistrationEventAttributeKeyEnum.fieldName,
        'duplicateStatus',
      ),
      this.createEventAttributeEntity(
        RegistrationEventAttributeKeyEnum.oldValue,
        'duplicate',
      ),
      this.createEventAttributeEntity(
        RegistrationEventAttributeKeyEnum.newValue,
        'unique',
      ),
      this.createEventAttributeEntity(
        RegistrationEventAttributeKeyEnum.duplicateWithRegistrationId,
        String(duplicateRegistration.id),
      ),
      this.createEventAttributeEntity(
        RegistrationEventAttributeKeyEnum.duplicateWithRegistrationProgramId,
        String(duplicateRegistration.registrationProgramId),
      ),
      this.createEventAttributeForReason(reason),
    ];
  }
}
