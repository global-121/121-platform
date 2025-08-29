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
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { UserEntity } from '@121-service/src/user/user.entity';
import { UserRoleEntity } from '@121-service/src/user/user-role.entity';

@Unique('userProjectAssignmentUnique', ['userId', 'projectId'])
@Entity('project_aidworker_assignment')
export class ProjectAidworkerAssignmentEntity extends Base121Entity {
  @ManyToOne(() => UserEntity, (user) => user.projectAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  public user: Relation<UserEntity>;
  @Column()
  public userId: number;

  @ManyToOne(() => ProjectEntity, (project) => project.aidworkerAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  public project: Relation<ProjectEntity>;
  @Column()
  public projectId: number;

  @ManyToMany(() => UserRoleEntity, (role) => role.assignments)
  @JoinTable()
  public roles: Relation<UserRoleEntity[]>;

  @Column({ nullable: false, default: '' })
  public scope: string;
}
