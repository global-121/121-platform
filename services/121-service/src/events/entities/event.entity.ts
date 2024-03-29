import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Base121AuditedEntity } from '../../base-audited.entity';
import { RegistrationEntity } from '../../registration/registration.entity';
import { UserEntity } from '../../user/user.entity';
import { EventEnum } from '../enum/event.enum';
import { EventAttributeEntity } from './event-attribute.entity';

@Entity('event')
export class EventEntity extends Base121AuditedEntity {
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  public user: UserEntity;
  @Column({ nullable: true })
  public userId: number;

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
