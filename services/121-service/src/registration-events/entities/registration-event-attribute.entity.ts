import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Relation,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { RegistrationEventEntity } from '@121-service/src/registration-events/entities/registration-event.entity';
import { RegistrationEventAttributeKeyEnum } from '@121-service/src/registration-events/enum/registration-event-attribute-key.enum';

@Entity('registration_event_attribute')
export class RegistrationEventAttributeEntity extends Base121Entity {
  @ManyToOne((_type) => RegistrationEventEntity, (event) => event.attributes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId' })
  public event: Relation<RegistrationEventEntity>;
  @Column()
  public eventId: number;

  @Index()
  @Column({ type: 'character varying' })
  public key: RegistrationEventAttributeKeyEnum;

  @Column({ type: 'character varying', nullable: true })
  public value: string | null;
}
