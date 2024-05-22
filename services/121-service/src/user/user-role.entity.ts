import { Base121Entity } from '@121-service/src/base.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker.entity';
import { PermissionEntity } from '@121-service/src/user/permissions.entity';
import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';

@Entity('user_role')
export class UserRoleEntity extends Base121Entity {
  @Column({ unique: true })
  public role: string;

  @Column({ nullable: true })
  public label: string | null;

  @ManyToMany(
    () => ProgramAidworkerAssignmentEntity,
    (assignment) => assignment.roles,
  )
  public assignments: ProgramAidworkerAssignmentEntity[];

  @ManyToMany(() => PermissionEntity, (permission) => permission.roles)
  @JoinTable()
  public permissions: PermissionEntity[];
}
