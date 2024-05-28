import { Base121OptionalAuditedEntity } from '@121-service/src/base-audited.entity';
import { EventAttributeEntity } from '@121-service/src/events/entities/event-attribute.entity';
import { EventEnum } from '@121-service/src/events/enum/event.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { UserEntity } from '@121-service/src/user/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
} from 'typeorm';

@Entity('event')
export class EventEntity extends Base121OptionalAuditedEntity {
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  public user: Relation<UserEntity>;

  @OneToMany(
    (_type) => EventAttributeEntity,
    (eventAttribute) => eventAttribute.event,
    { cascade: true },
  )
  public attributes: EventAttributeEntity[];

  @Index()
  @Column({ type: 'varchar' })
  public type: EventEnum;

  @ManyToOne(() => RegistrationEntity)
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Column()
  public registrationId: number;
}
