import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RegistrationStatusEnum } from './registration-status.enum';
import { RegistrationEntity } from './registration.entity';

@Entity('registration_status_change')
export class RegistrationStatusChangeEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => RegistrationEntity)
  @JoinColumn()
  public registration: RegistrationEntity;

  @Index()
  @Column()
  public registrationStatus: RegistrationStatusEnum;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created: Date;
}
