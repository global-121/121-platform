import { UserRole } from '../user-role.enum';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { UserEntity } from './user.entity';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';
import { Base121Entity } from '../base.entity';

@Entity('user_role')
export class UserRoleEntity extends Base121Entity {
  @Column()
  public role: UserRole;

  @Column({ nullable: true })
  public label: string;

  @ManyToMany(
    () => ProgramAidworkerAssignmentEntity,
    assignment => assignment.roles,
  )
  public assignments: ProgramAidworkerAssignmentEntity[];
}
