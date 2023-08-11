import crypto from 'crypto';
import {
  BeforeInsert,
  BeforeRemove,
  Column,
  Entity,
  Index,
  OneToMany,
} from 'typeorm';
import { ActionEntity } from '../actions/action.entity';
import { CascadeDeleteEntity } from '../base.entity';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';
import { RegistrationChangeLogEntity } from '../registration/modules/registration-change-log/registration-change-log.entity';
import { PersonAffectedAppDataEntity } from './../people-affected/person-affected-app-data.entity';
import { RegistrationEntity } from './../registration/registration.entity';
import { UserType } from './user-type-enum';

@Entity('user')
export class UserEntity extends CascadeDeleteEntity {
  @Index({ unique: true })
  @Column({ nullable: true })
  public username: string;

  @Column({ select: false })
  public password: string;

  @BeforeInsert()
  public hashPassword(): any {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.password = crypto
      .pbkdf2Sync(this.password, this.salt, 1, 32, 'sha256')
      .toString('hex');
  }

  @OneToMany(
    () => ProgramAidworkerAssignmentEntity,
    (assignment) => assignment.user,
  )
  public programAssignments: ProgramAidworkerAssignmentEntity[];

  @OneToMany(() => ActionEntity, (program) => program.user)
  public actions: ActionEntity[];

  @OneToMany(() => RegistrationEntity, (registration) => registration.user)
  public registrations: RegistrationEntity[];

  @OneToMany(
    () => PersonAffectedAppDataEntity,
    (personAffectedAppData) => personAffectedAppData.user,
  )
  public personAffectedAppData: PersonAffectedAppDataEntity[];

  @OneToMany(() => RegistrationChangeLogEntity, (changes) => changes.user)
  public changes: RegistrationChangeLogEntity[];

  @Column()
  public userType: UserType;

  @Column({ default: false })
  public admin: boolean;

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

  @Column({ nullable: true, select: false })
  public salt: string;
}
