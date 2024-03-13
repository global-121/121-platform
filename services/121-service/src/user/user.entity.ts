import { ApiProperty } from '@nestjs/swagger';
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
import { NoteEntity } from '../notes/note.entity';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';
import { PersonAffectedAppDataEntity } from './../people-affected/person-affected-app-data.entity';
import { RegistrationEntity } from './../registration/registration.entity';
import { UserType } from './user-type-enum';

@Entity('user')
export class UserEntity extends CascadeDeleteEntity {
  @Index({ unique: true })
  @Column({ nullable: true })
  @ApiProperty({ example: 'username' })
  public username: string;

  @Column({ select: false })
  @ApiProperty()
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

  @OneToMany(() => NoteEntity, (notes) => notes.user)
  public notes: NoteEntity[];

  @Column()
  @ApiProperty({ example: UserType.aidWorker })
  public userType: UserType;

  @Column({ default: false })
  @ApiProperty({ example: false })
  public admin: boolean;

  @Column({ default: false })
  @ApiProperty({ example: false })
  public isEntraUser: boolean;

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
  @ApiProperty()
  public salt: string;

  @Column({ default: true })
  @ApiProperty({ example: true })
  public active: boolean;

  @Column({ nullable: true })
  @ApiProperty({ example: new Date() })
  public lastLogin: Date;
}
