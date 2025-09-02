import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Relation,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { PaymentEventEntity } from '@121-service/src/payments/payment-events/entities/payment-event.entity';
import { PaymentEventAttributeKey } from '@121-service/src/payments/payment-events/enums/payment-event-attribute-key.enum';

@Entity('payment_event_attribute')
export class PaymentEventAttributeEntity extends Base121Entity {
  @ManyToOne((_type) => PaymentEventEntity, (event) => event.attributes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId' })
  public event: Relation<PaymentEventEntity>;
  @Column()
  public eventId: number;

  @Index()
  @Column({ type: 'character varying' })
  public key: PaymentEventAttributeKey;

  @Column({ type: 'character varying', nullable: true })
  public value: string | null;
}
