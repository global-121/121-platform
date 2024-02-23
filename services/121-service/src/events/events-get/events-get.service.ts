import { Inject, Injectable } from '@nestjs/common';
import { Between } from 'typeorm';
import { ScopedRepository } from '../../scoped.repository';
import { getScopedRepositoryProviderName } from '../../utils/scope/createScopedRepositoryProvider.helper';
import { EventSearchOptionsDto } from '../dto/event-search-options.dto';
import { GetEventXlsxDto } from '../dto/get-event-xlsx.dto';
import { GetEventDto } from '../dto/get-event.dto';
import { EventEntity } from '../entities/event.entity';
import { EventsMapper } from '../utils/events.mapper';

@Injectable()
export class EventGetService {
  constructor(
    @Inject(getScopedRepositoryProviderName(EventEntity))
    private eventRepository: ScopedRepository<EventEntity>,
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
    const events = await this.eventRepository.find({
      where: this.createWhereClause(programId, searchOptions),
      relations: ['registration', 'user', 'attributes'],
      order: { created: 'DESC' },
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
}
