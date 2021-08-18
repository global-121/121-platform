import { UserRole } from '../user-role.enum';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { UserEntity } from './user.entity';
import { ProgramAidworkerAssignmentEntity } from '../programs/program/program-aidworker.entity';

@Entity('user_role')
export class UserRoleEntity {
  @PrimaryGeneratedColumn()
  public id: number;

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
