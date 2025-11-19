import { DataSource, DeepPartial, Equal, Raw } from 'typeorm';

import { RegistrationEventEntity } from '@121-service/src/registration-events/entities/registration-event.entity';
import { RegistrationEventAttributeEntity } from '@121-service/src/registration-events/entities/registration-event-attribute.entity';
import { BaseSeedFactory } from '@121-service/src/scripts/factories/base-seed-factory';

class AttributeBatchInsertHelper extends BaseSeedFactory<RegistrationEventAttributeEntity> {
  constructor(dataSource: DataSource) {
    super(
      dataSource,
      dataSource.getRepository(RegistrationEventAttributeEntity),
    );
  }
  public async batchInsert(
    attrs: DeepPartial<RegistrationEventAttributeEntity>[],
  ) {
    return this.insertEntitiesBatch(attrs);
  }
}

export class RegistrationEventSeedFactory extends BaseSeedFactory<RegistrationEventEntity> {
  private readonly attrBatchHelper: AttributeBatchInsertHelper;
  constructor(dataSource: DataSource) {
    super(dataSource, dataSource.getRepository(RegistrationEventEntity));
    this.attrBatchHelper = new AttributeBatchInsertHelper(dataSource);
  }

  public async duplicateRegistrationEvents(
    newRegistrationIds: number[],
    programId: number,
    registrationRepository: any,
  ): Promise<void> {
    console.log(
      `Creating registration events for ${newRegistrationIds.length} new registrations`,
    );
    // Get all original events for this program
    const originalRegistrations = await registrationRepository.find({
      where: { programId: Equal(programId) },
      order: { id: 'ASC' },
    });
    const originalRegistrationIds = originalRegistrations.map((r: any) => r.id);
    const events = await this.repository.find({
      where: {
        registrationId: Raw((alias) => `${alias} = ANY(:ids)`, {
          ids: originalRegistrationIds,
        }),
      },
      relations: ['attributes'],
      order: { registrationId: 'ASC', id: 'ASC' },
    });
    if (events.length === 0) {
      console.warn(
        'No registration events found to duplicate for programId',
        programId,
      );
      return;
    }
    // Map new registrations to original registrations by index
    const allNewEvents: DeepPartial<RegistrationEventEntity>[] = [];
    const eventMapping: {
      origEvent: RegistrationEventEntity;
      newRegistrationId: number;
    }[] = [];
    for (let i = 0; i < newRegistrationIds.length; i++) {
      const newRegistrationId = newRegistrationIds[i];
      const originalRegistrationId =
        originalRegistrationIds[i % originalRegistrationIds.length];
      const eventsForOriginal = events.filter(
        (e) => e.registrationId === originalRegistrationId,
      );
      for (const event of eventsForOriginal) {
        allNewEvents.push({
          id: undefined,
          registrationId: newRegistrationId,
          type: event.type,
          userId: (event as any).userId ?? undefined,
        });
        eventMapping.push({ origEvent: event, newRegistrationId });
      }
    }
    // Insert all events in one batch
    const insertedEventIds = await this.insertEntitiesBatch(allNewEvents);
    // Collect all attributes for all new events
    const allNewAttrs: DeepPartial<RegistrationEventAttributeEntity>[] = [];
    for (let k = 0; k < eventMapping.length; k++) {
      const { origEvent } = eventMapping[k];
      const newEventId = insertedEventIds[k];
      if (origEvent.attributes && origEvent.attributes.length > 0) {
        const newAttrs: DeepPartial<RegistrationEventAttributeEntity>[] =
          origEvent.attributes.map((attr) => ({
            id: undefined,
            eventId: newEventId,
            key: attr.key,
            value: attr.value,
          }));
        if (newAttrs.length > 0) {
          allNewAttrs.push(...newAttrs);
        }
      }
    }
    if (allNewAttrs.length > 0) {
      await this.attrBatchHelper.batchInsert(allNewAttrs);
    }

    console.log(
      `Created ${insertedEventIds.length} new registration event entries`,
    );
  }
}
