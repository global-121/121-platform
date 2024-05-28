import { Base121Entity } from '@121-service/src/base.entity';
import { EventEntity } from '@121-service/src/events/entities/event.entity';
import { EventAttributeKeyEnum } from '@121-service/src/events/enum/event-attribute-key.enum';

import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Relation,
} from 'typeorm';

@Entity('event_attribute')
export class EventAttributeEntity extends Base121Entity {
  @ManyToOne((_type) => EventEntity, (event) => event.attributes)
  @JoinColumn({ name: 'eventId' })
  public event: Relation<EventEntity>;
  @Column()
  public eventId: number;

  @Index()
  @Column({ type: 'character varying' })
  public key: EventAttributeKeyEnum;

  @Column({ type: 'character varying', nullable: true })
  public value: string | null;
}
