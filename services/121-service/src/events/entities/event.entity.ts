import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Base121OptionalAuditedEntity } from '../../base-audited.entity';
import { RegistrationEntity } from '../../registration/registration.entity';
import { UserEntity } from '../../user/user.entity';
import { EventEnum } from '../enum/event.enum';
import { EventAttributeEntity } from './event-attribute.entity';

@Entity('event')
export class EventEntity extends Base121OptionalAuditedEntity {
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  public user: UserEntity;

  @OneToMany(
    (_type) => EventAttributeEntity,
    (eventAttribute) => eventAttribute.event,
    { cascade: true },
  )
  public attributes: EventAttributeEntity[];

  @Index()
  @Column()
  public type: EventEnum;

  @ManyToOne(() => RegistrationEntity)
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
  @Column()
  public registrationId: number;
}
