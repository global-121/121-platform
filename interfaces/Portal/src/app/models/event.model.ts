import EventType from '../enums/event-type.enum';

export class Event {
  id: number;
  created: string;
  user: {
    id: number;
    username: string;
  };
  registrationId: number;
  type: EventType;
  attributes: Record<string, string>;
}
