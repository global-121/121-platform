import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Base121Entity } from '../base.entity';
import { RegistrationStatusEnum } from './enum/registration-status.enum';
import { RegistrationEntity } from './registration.entity';

@Entity('registration_status_change')
export class RegistrationStatusChangeEntity extends Base121Entity {
  @ManyToOne(
    _type => RegistrationEntity,
    registration => registration.statusChanges,
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
  @Column()
  public registrationId: number;

  @Index()
  @Column()
  public registrationStatus: RegistrationStatusEnum;
}
