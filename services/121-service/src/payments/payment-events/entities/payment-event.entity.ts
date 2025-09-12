import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
} from 'typeorm';

import { Base121OptionalAuditedEntity } from '@121-service/src/base-audited.entity';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { PaymentEventAttributeEntity } from '@121-service/src/payments/payment-events/entities/payment-event-attribute.entity';
import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

@Entity('payment_event')
export class PaymentEventEntity extends Base121OptionalAuditedEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'NO ACTION' }) // Do not delete on deleting users, instead see catch in userService.delete()
  @JoinColumn({ name: 'userId' })
  public user?: Relation<UserEntity>;

  @OneToMany(
    (_type) => PaymentEventAttributeEntity,
    (eventAttribute) => eventAttribute.event,
    { cascade: true },
  )
  public attributes: PaymentEventAttributeEntity[];

  @Index()
  @Column({ type: 'character varying' })
  public type: PaymentEvent;

  @ManyToOne(() => PaymentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  public payment: Relation<PaymentEntity>;
  @Column()
  public paymentId: number;
}
