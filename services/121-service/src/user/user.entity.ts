import { PersonAffectedAppDataEntity } from './../people-affected/person-affected-app-data.entity';
import { UserType } from './user-type-enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { IsEmail } from 'class-validator';
import crypto from 'crypto';
import { ProgramEntity } from '../programs/program/program.entity';
import { ActionEntity } from '../actions/action.entity';
import { UserRoleEntity } from './user-role.entity';
import { RegistrationEntity } from '../registration/registration.entity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public username: string;

  @Column({ select: false })
  public password: string;

  @ManyToMany(
    () => UserRoleEntity,
    role => role.users,
  )
  @JoinTable()
  public roles: UserRoleEntity[];

  @BeforeInsert()
  public hashPassword(): any {
    this.password = crypto.createHmac('sha256', this.password).digest('hex');
  }

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created: Date;

  @OneToMany(
    () => ProgramEntity,
    program => program.author,
  )
  public programs: ProgramEntity[];

  @OneToMany(
    () => ActionEntity,
    program => program.user,
  )
  public actions: ActionEntity[];

  @ManyToMany(
    () => ProgramEntity,
    program => program.aidworkers,
  )
  public assignedProgram: ProgramEntity[];

  @OneToMany(
    () => RegistrationEntity,
    registration => registration.user,
  )
  public registrations: RegistrationEntity[];

  @OneToMany(
    () => PersonAffectedAppDataEntity,
    personAffectedAppData => personAffectedAppData.user,
  )
  public personAffectedAppData: PersonAffectedAppDataEntity[];

  public userType: UserType;
}
