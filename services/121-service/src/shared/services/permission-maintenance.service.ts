import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PermissionEntity } from '@121-service/src/user/entities/permissions.entity';
import { UserRoleEntity } from '@121-service/src/user/entities/user-role.entity';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

@Injectable()
export class PermissionMaintenanceService {
  @InjectRepository(PermissionEntity)
  private readonly permissionRepository: Repository<PermissionEntity>;
  @InjectRepository(UserRoleEntity)
  private readonly userRoleRepository: Repository<UserRoleEntity>;

  /**
   * To prevent future issues with unknown/outdated/extraneous permissions on User(-Role)s,
   * we remove any permission that is unused/undocumented anywhere in the code.
   */
  public async removeExtraneousPermissions(): Promise<void> {
    const supportedPermissions = Object.values(PermissionEnum);
    const allPermissions = await this.permissionRepository.find();

    const extraneousPermissions = allPermissions.filter(
      (permission) => !supportedPermissions.includes(permission.name),
    );

    if (extraneousPermissions.length === 0) {
      return;
    }

    // First, delete related records that reference these permissions
    await this.userRoleRepository
      .createQueryBuilder()
      .relation(UserRoleEntity, 'permissions')
      .of(extraneousPermissions)
      .remove(extraneousPermissions);

    // Remove extraneous permissions
    const removedPermissions = await this.permissionRepository.remove(
      extraneousPermissions,
    );

    console.log(
      'Extraneous permissions removed:',
      `${removedPermissions.length} of ${extraneousPermissions.length}`,
      removedPermissions,
    );
  }
}
