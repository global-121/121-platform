import { Entity, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { Base121Entity } from '../base.entity';
import { UserRoleEntity } from '../user/user-role.entity';
import { UserEntity } from '../user/user.entity';
import { ProgramEntity } from './program.entity';

@Entity('program_aidworker_assignment')
export class ProgramAidworkerAssignmentEntity extends Base121Entity {
  @ManyToOne(
    () => UserEntity,
    user => user.programAssignments,
  )
  public user: UserEntity;

  @ManyToOne(
    () => ProgramEntity,
    program => program.aidworkerAssignments,
  )
  public program: ProgramEntity;

  @ManyToMany(
    () => UserRoleEntity,
    role => role.assignments,
  )
  @JoinTable()
  public roles: UserRoleEntity[];
}
