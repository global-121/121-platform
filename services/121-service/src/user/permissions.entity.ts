import { Column, Entity, Index, ManyToMany } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserRoleEntity } from '@121-service/src/user/user-role.entity';

@Entity('permission')
export class PermissionEntity extends Base121Entity {
  @Column({ type: 'character varying' })
  @Index({ unique: true })
  public name: PermissionEnum;

  @ManyToMany(() => UserRoleEntity, (roles) => roles.permissions)
  public roles: UserRoleEntity[];
}
