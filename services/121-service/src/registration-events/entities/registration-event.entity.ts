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
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationEventAttributeEntity } from '@121-service/src/registration-events/entities/registration-event-attribute.entity';
import { RegistrationEventEnum } from '@121-service/src/registration-events/enum/registration-event.enum';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

@Entity('registration_event')
export class RegistrationEventEntity extends Base121OptionalAuditedEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'NO ACTION' }) // Do not delete on deleting users, instead see catch in userService.delete()
  @JoinColumn({ name: 'userId' })
  public user: Relation<UserEntity>;

  @OneToMany(
    (_type) => RegistrationEventAttributeEntity,
    (eventAttribute) => eventAttribute.event,
    { cascade: true },
  )
  public attributes: RegistrationEventAttributeEntity[];

  @Index()
  @Column({ type: 'character varying' })
  public type: RegistrationEventEnum;

  @ManyToOne(() => RegistrationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Column()
  public registrationId: number;
}
