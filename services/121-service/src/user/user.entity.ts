import { RegistrationEntity } from './../registration/registration.entity';
import { PersonAffectedAppDataEntity } from './../people-affected/person-affected-app-data.entity';
import { UserType } from './user-type-enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  OneToMany,
  Index,
  BeforeRemove,
} from 'typeorm';
import crypto from 'crypto';
import { ActionEntity } from '../actions/action.entity';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';
import { CascadeDeleteEntity } from '../base.entity';

@Entity('user')
export class UserEntity extends CascadeDeleteEntity {
  @Index({ unique: true })
  @Column({ nullable: true })
  public username: string;

  @Column({ select: false })
  public password: string;

  @BeforeInsert()
  public hashPassword(): any {
    this.password = crypto.createHmac('sha256', this.password).digest('hex');
  }

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

  @Column()
  public userType: UserType;

  @BeforeRemove()
  public async cascadeDelete(): Promise<void> {
    await this.deleteAllOneToMany([
      {
        entityClass: RegistrationEntity,
        columnName: 'user',
      },
      {
        entityClass: PersonAffectedAppDataEntity,
        columnName: 'user',
      },
      {
        entityClass: ActionEntity,
        columnName: 'user',
      },
      {
        entityClass: ProgramAidworkerAssignmentEntity,
        columnName: 'user',
      },
    ]);
  }
}
