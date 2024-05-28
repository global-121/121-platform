import { ActionEntity } from '@121-service/src/actions/action.entity';
import { CascadeDeleteEntity } from '@121-service/src/base.entity';
import { NoteEntity } from '@121-service/src/notes/note.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { UserType } from '@121-service/src/user/user-type-enum';
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

@Entity('user')
export class UserEntity extends CascadeDeleteEntity {
  @Index({ unique: true })
  @Column({ type: 'character varying', nullable: true })
  @ApiProperty({ example: 'username' })
  public username: string | null;

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
        entityClass: ActionEntity,
        columnName: 'user',
      },
      {
        entityClass: ProgramAidworkerAssignmentEntity,
        columnName: 'user',
      },
    ]);
  }

  @Column({ nullable: true, select: false, type: 'character varying' })
  @ApiProperty()
  public salt: string | null;

  @Column({ default: true })
  @ApiProperty({ example: true })
  public active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ example: new Date() })
  public lastLogin: Date | null;
}
