import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Base121Entity } from '../base.entity';
import { RegistrationStatusEnum } from './enum/registration-status.enum';
import { RegistrationEntity } from './registration.entity';

@Entity('registration_status_change')
export class RegistrationStatusChangeEntity extends Base121Entity {
  @ManyToOne(
    _type => RegistrationEntity,
    registration => registration.statusChanges,
  )
  public registration: RegistrationEntity;

  @Index()
  @Column()
  public registrationStatus: RegistrationStatusEnum;
}
