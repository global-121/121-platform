import { Base121Entity } from '@121-service/src/base.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { UserRoleEntity } from '@121-service/src/user/user-role.entity';
import { UserEntity } from '@121-service/src/user/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  Unique,
} from 'typeorm';

@Unique('userProgramAssignmentUnique', ['userId', 'programId'])
@Entity('program_aidworker_assignment')
export class ProgramAidworkerAssignmentEntity extends Base121Entity {
  @ManyToOne(() => UserEntity, (user) => user.programAssignments)
  @JoinColumn({ name: 'userId' })
  public user: UserEntity;
  @Column()
  public userId: number;

  @ManyToOne(() => ProgramEntity, (program) => program.aidworkerAssignments)
  @JoinColumn({ name: 'programId' })
  public program: ProgramEntity;
  @Column()
  public programId: number;

  @ManyToMany(() => UserRoleEntity, (role) => role.assignments)
  @JoinTable()
  public roles: UserRoleEntity[];

  @Column({ nullable: false, default: '' })
  public scope: string;
}
