import { PersonAffectedAppDataEntity } from './../people-affected/person-affected-app-data.entity';
import { UserType } from './user-type-enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  OneToMany,
  Index,
} from 'typeorm';
import crypto from 'crypto';
import { ActionEntity } from '../actions/action.entity';
import { RegistrationEntity } from '../registration/registration.entity';
import { ProgramAidworkerAssignmentEntity } from '../programs/program/program-aidworker.entity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Index({ unique: true })
  @Column({ nullable: true })
  public username: string;

  @Column({ select: false })
  public password: string;

  @BeforeInsert()
  public hashPassword(): any {
    this.password = crypto.createHmac('sha256', this.password).digest('hex');
  }

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created: Date;

  @OneToMany(
    () => ProgramAidworkerAssignmentEntity,
    assignment => assignment.user,
  )
  public programAssignments: ProgramAidworkerAssignmentEntity[];

  @OneToMany(
    () => ActionEntity,
    program => program.user,
  )
  public actions: ActionEntity[];

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
