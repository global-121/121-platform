import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  Relation,
  Unique,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { UserEntity } from '@121-service/src/user/user.entity';
import { UserRoleEntity } from '@121-service/src/user/user-role.entity';

@Unique('userProgramAssignmentUnique', ['userId', 'programId'])
@Entity('program_aidworker_assignment')
export class ProgramAidworkerAssignmentEntity extends Base121Entity {
  @ManyToOne(() => UserEntity, (user) => user.programAssignments)
  @JoinColumn({ name: 'userId' })
  public user: Relation<UserEntity>;
  @Column()
  public userId: number;

  @ManyToOne(() => ProgramEntity, (program) => program.aidworkerAssignments)
  @JoinColumn({ name: 'programId' })
  public program: Relation<ProgramEntity>;
  @Column()
  public programId: number;

  @ManyToMany(() => UserRoleEntity, (role) => role.assignments)
  @JoinTable()
  public roles: Relation<UserRoleEntity[]>;

  @Column({ nullable: false, default: '' })
  public scope: string;
}
