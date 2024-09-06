import { EventEntity } from '@121-service/src/events/entities/event.entity';
import { MessageHistoryDto } from '@121-service/src/registration/dto/message-history.dto';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { Dto } from '~/utils/dto-type';

export type Registration = Dto<RegistrationEntity>;
export type RegistrationView = Dto<RegistrationViewEntity>;
export type Message = Dto<MessageHistoryDto>;
export type RegistrationEvent = Dto<EventEntity>;

export interface RegistrationActivityLogEntry {
  id: string;
  activityType: string;
  overview: string;
  doneBy: string;
  timestamp: Date;
  details: string;
}
