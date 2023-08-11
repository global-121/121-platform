import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Base121Entity } from '../../../base.entity';
import { UserEntity } from '../../../user/user.entity';
import { RegistrationEntity } from '../../registration.entity';

@Entity('registration_change_log')
export class RegistrationChangeLogEntity extends Base121Entity {
  @ManyToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.changes,
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
  @Column()
  public registrationId: number;

  @ManyToOne((_type) => UserEntity, (user) => user.changes)
  @JoinColumn({ name: 'userId' })
  public user: UserEntity;
  @Column()
  public userId: number;

  @Column()
  public fieldName: string;

  @Column()
  public oldValue: string;

  @Column()
  public newValue: string;

  @Column()
  public reason: string;
}
