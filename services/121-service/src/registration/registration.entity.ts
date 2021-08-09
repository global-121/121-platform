import { UserEntity } from '../user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProgramEntity } from '../programs/program/program.entity';
import { RegistrationStatusEnum } from './registration-status.enum';

@Entity('registration')
export class RegistrationEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(
    type => ProgramEntity,
    program => program.registrations,
  )
  public program: ProgramEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn()
  public user: UserEntity;

  public name: string;

  // @Index()
  public registrationStatus: RegistrationStatusEnum;

  // @Index({ unique: true })
  public qrCode: string;
}
