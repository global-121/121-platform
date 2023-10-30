import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { Base121Entity } from '../base.entity';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';
import { PermissionEntity } from './permissions.entity';

@Entity('user_role')
export class UserRoleEntity extends Base121Entity {
  @ApiProperty()
  @Column({ unique: true })
  public role: string;

  @ApiProperty()
  @Column({ nullable: true })
  public label: string;

  @ApiProperty()
  @ManyToMany(
    () => ProgramAidworkerAssignmentEntity,
    (assignment) => assignment.roles,
  )
  public assignments: ProgramAidworkerAssignmentEntity[];

  @ApiProperty()
  @ManyToMany(() => PermissionEntity, (permission) => permission.roles)
  @JoinTable()
  public permissions: PermissionEntity[];
}
