import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { ProjectAidworkerAssignmentEntity } from '@121-service/src/projects/project-aidworker.entity';
import { PermissionEntity } from '@121-service/src/user/permissions.entity';

@Entity('user_role')
export class UserRoleEntity extends Base121Entity {
  @Column({ unique: true })
  public role: string;

  @Column({ type: 'character varying', nullable: true })
  public label: string | null;

  @Column({ type: 'character varying', nullable: true })
  public description: string | null;

  @ManyToMany(
    () => ProjectAidworkerAssignmentEntity,
    (assignment) => assignment.roles,
  )
  public assignments: ProjectAidworkerAssignmentEntity[];

  @ManyToMany(() => PermissionEntity, (permission) => permission.roles)
  @JoinTable()
  public permissions: PermissionEntity[];
}
