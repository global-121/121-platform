import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Base121Entity } from '../../base.entity';
import { EventAttributeKeyEnum } from '../enum/event-attribute-key.enum';
import { EventEntity } from './event.entity';

@Entity('event_attribute')
export class EventAttributeEntity extends Base121Entity {
  @ManyToOne((_type) => EventEntity, (event) => event.attributes)
  @JoinColumn({ name: 'eventId' })
  public event: EventEntity;
  @Column()
  public eventId: number;

  @Column()
  public key: EventAttributeKeyEnum;

  @Column({ nullable: true })
  public value: string;
}
