import { PermissionEnum } from './permission.enum';
import { Entity, Column, ManyToMany } from 'typeorm';
import { Base121Entity } from '../base.entity';
import { UserRoleEntity } from './user-role.entity';

@Entity('permissions')
export class PermissionsEntity extends Base121Entity {
  @Column()
  public permission: PermissionEnum;

  @ManyToMany(
    () => UserRoleEntity,
    roles => roles.permissions,
  )
  public roles: UserRoleEntity[];
}
