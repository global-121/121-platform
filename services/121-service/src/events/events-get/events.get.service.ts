import { Inject, Injectable } from '@nestjs/common';
import { Between } from 'typeorm';
import { ScopedRepository } from '../../scoped.repository';
import { getScopedRepositoryProviderName } from '../../utils/scope/createScopedRepositoryProvider.helper';
import { EventSearchOptionsDto } from '../dto/event-search-options.dto';
import { GetEventDto } from '../dto/get-event.dto';
import { EventAttributeEntity } from '../entities/event-attribute.entity';
import { EventEntity } from '../entities/event.entity';

@Injectable()
export class EventGetService {
  constructor(
    @Inject(getScopedRepositoryProviderName(EventEntity))
    private eventRepository: ScopedRepository<EventEntity>,
  ) {}

  public async getEvents(
    programId: number,
    searchOptions: EventSearchOptionsDto,
  ): Promise<GetEventDto[]> {
    const exportLimit = 100000;
    const events = await this.eventRepository.find({
      where: this.createWhereClause(programId, searchOptions),
      relations: ['registration', 'user', 'attributes'],
      order: { created: 'DESC' },
      take: exportLimit,
    });

    return this.mapEventsToJsonDtos(events);
  }

  private createWhereClause(
    programId: number,
    searchOptions: EventSearchOptionsDto,
  ) {
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

  // private mapEventToXlsxDto(events: EventEntity[]): GetEventXlsxDto[] {
  //   const mappedEvents: GetEventXlsxDto[] = events.map((event) => {
  //     const attributes = this.createAttributesObject(event.attributes);
  //     return {
  //       paId: event.registration.registrationProgramId,
  //       referenceId: event.registration.referenceId,
  //       changedAt: event.created,
  //       changedBy: event.user.username,
  //       type: event.type,
  //       ...attributes,
  //     };
  //   });

  //   return mappedEvents;
  // }

  private mapEventsToJsonDtos(events: EventEntity[]): GetEventDto[] {
    const mappedEvents: GetEventDto[] = events.map((event) => {
      const attributes = this.createAttributesObject(event.attributes);
      return {
        id: event.id,
        created: event.created,
        user: { id: event.userId, username: event.user.username },
        registrationId: event.registrationId,
        type: event.type,
        attributes: attributes,
      };
    });

    return mappedEvents;
  }

  private createAttributesObject(
    attributes: EventAttributeEntity[],
  ): Record<string, any> {
    const attributesObject: Record<string, any> = {};
    for (const attribute of attributes) {
      attributesObject[attribute.key] = attribute.value;
    }
    return attributesObject;
  }
}
