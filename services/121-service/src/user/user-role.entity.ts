import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';
import { Base121Entity } from '../base.entity';
import { PermissionEntity } from './permissions.entity';

@Entity('user_role')
export class UserRoleEntity extends Base121Entity {
  @Column()
  public role: string;

  @Column({ nullable: true })
  public label: string;

  @ManyToMany(
    () => ProgramAidworkerAssignmentEntity,
    assignment => assignment.roles,
  )
  public assignments: ProgramAidworkerAssignmentEntity[];

  @ManyToMany(
    () => PermissionEntity,
    permission => permission.roles,
  )
  @JoinTable()
  public permissions: PermissionEntity[];
}
