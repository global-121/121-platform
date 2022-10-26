import { Column, Entity, Index, ManyToMany } from 'typeorm';
import { Base121Entity } from '../base.entity';
import { PermissionEnum } from './permission.enum';
import { UserRoleEntity } from './user-role.entity';

@Entity('permission')
export class PermissionEntity extends Base121Entity {
  @Column()
  @Index({ unique: true })
  public name: PermissionEnum;

  @ManyToMany(
    () => UserRoleEntity,
    roles => roles.permissions,
  )
  public roles: UserRoleEntity[];
}
