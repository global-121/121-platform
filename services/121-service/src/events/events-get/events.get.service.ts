import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetEventDto } from '../dto/getEvent.dto';
import { EventEntity } from '../entities/event.entity';

@Injectable()
export class EventGetService {
  @InjectRepository(EventEntity)
  private readonly eventRepository: Repository<EventEntity>;

  async getEvents(
    programId: number,
    referenceId: string,
  ): Promise<GetEventDto[]> {
    const events = await this.eventRepository.find({
      where: {
        registration: {
          referenceId: referenceId,
          programId: programId,
        },
      },
      relations: ['attributes', 'user'],
    });

    const mappedEvents: GetEventDto[] = events.map((event) => {
      const attributes: Record<string, any> = {};
      for (const attribute of event.attributes) {
        attributes[attribute.key] = attribute.value;
      }
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
}
