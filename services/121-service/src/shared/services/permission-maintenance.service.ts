import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { PostgresStatusCodes } from '@121-service/src/shared/enum/postgres-status-codes.enum';
import {
  DEFAULT_USER_ROLES,
  DefaultUserRoleDefinition,
} from '@121-service/src/user/const/default-user-roles.const';
import { PermissionEntity } from '@121-service/src/user/entities/permissions.entity';
import { UserRoleEntity } from '@121-service/src/user/entities/user-role.entity';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

@Injectable()
export class PermissionMaintenanceService {
  @InjectRepository(PermissionEntity)
  private readonly permissionRepository: Repository<PermissionEntity>;
  @InjectRepository(UserRoleEntity)
  private readonly userRoleRepository: Repository<UserRoleEntity>;

  public async syncSupportedPermissions(): Promise<void> {
    const supportedPermissions = Object.values(PermissionEnum);
    const allPermissions = await this.permissionRepository.find();

    for (const permissionName of supportedPermissions) {
      await this.getOrCreatePermission({
        permissionName,
        allPermissions,
      });
    }
  }

  /**
   * Keeps all default roles in sync with the seed definition
   * (DEFAULT_USER_ROLES), so that every instance has the same permissions
   * behind the same default role name. Default roles are read-only via the
   * API, so any drift can only come from direct database changes.
   */
  public async syncDefaultRoles(): Promise<void> {
    const allPermissions = await this.permissionRepository.find();
    const permissionsByName = new Map(
      allPermissions.map((permission) => [permission.name, permission]),
    );
    const existingRoles = await this.userRoleRepository.find({
      relations: { permissions: true },
    });
    const rolesByName = new Map(
      existingRoles.map((role) => [role.role, role]),
    );

    for (const defaultRole of DEFAULT_USER_ROLES) {
      await this.syncDefaultRole({
        defaultRole,
        rolesByName,
        permissionsByName,
      });
    }
  }

  private async syncDefaultRole({
    defaultRole,
    rolesByName,
    permissionsByName,
  }: {
    defaultRole: DefaultUserRoleDefinition;
    rolesByName: Map<string, UserRoleEntity>;
    permissionsByName: Map<string, PermissionEntity>;
  }): Promise<void> {
    const targetPermissions = defaultRole.permissions
      .map((permissionName) => permissionsByName.get(permissionName))
      .filter((permission) => permission !== undefined);

    const existingRole = rolesByName.get(defaultRole.role);

    if (!existingRole) {
      await this.createDefaultRole({ defaultRole, targetPermissions });
      return;
    }

    if (
      this.isDefaultRoleInSync({ existingRole, defaultRole, targetPermissions })
    ) {
      return;
    }

    existingRole.label = defaultRole.label;
    existingRole.permissions = targetPermissions;
    await this.persistRoleUpdates({ userRole: existingRole });
  }

  private async createDefaultRole({
    defaultRole,
    targetPermissions,
  }: {
    defaultRole: DefaultUserRoleDefinition;
    targetPermissions: PermissionEntity[];
  }): Promise<void> {
    const userRole = new UserRoleEntity();
    userRole.role = defaultRole.role;
    userRole.label = defaultRole.label;
    userRole.permissions = targetPermissions;

    await this.persistRoleUpdates({ userRole });
  }

  private isDefaultRoleInSync({
    existingRole,
    defaultRole,
    targetPermissions,
  }: {
    existingRole: UserRoleEntity;
    defaultRole: DefaultUserRoleDefinition;
    targetPermissions: PermissionEntity[];
  }): boolean {
    if (existingRole.label !== defaultRole.label) {
      return false;
    }

    const currentPermissionNames = new Set(
      (existingRole.permissions ?? []).map((permission) => permission.name),
    );
    if (currentPermissionNames.size !== targetPermissions.length) {
      return false;
    }

    return targetPermissions.every((permission) =>
      currentPermissionNames.has(permission.name),
    );
  }

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

  private async getOrCreatePermission({
    permissionName,
    allPermissions,
  }: {
    permissionName: PermissionEnum;
    allPermissions: PermissionEntity[];
  }): Promise<PermissionEntity> {
    const existingPermission = allPermissions.find(
      (permission) => permission.name === permissionName,
    );

    if (existingPermission) {
      return existingPermission;
    }

    const createdPermission = await this.createMissingPermission({
      permissionName,
    });
    allPermissions.push(createdPermission);
    return createdPermission;
  }

  private async persistRoleUpdates({
    userRole,
  }: {
    userRole: UserRoleEntity;
  }): Promise<void> {
    try {
      await this.userRoleRepository.save(userRole);
    } catch (error: unknown) {
      if (!this.isUniqueViolationError({ error })) {
        throw error;
      }
    }
  }

  private async createMissingPermission({
    permissionName,
  }: {
    permissionName: PermissionEnum;
  }): Promise<PermissionEntity> {
    const existingPermission = await this.permissionRepository.findOne({
      where: { name: Equal(permissionName) },
    });

    if (existingPermission) {
      return existingPermission;
    }

    try {
      return await this.permissionRepository.save({
        name: permissionName,
      } as PermissionEntity);
    } catch (error: unknown) {
      if (!this.isUniqueViolationError({ error })) {
        throw error;
      }
    }

    const persistedPermission = await this.permissionRepository.findOne({
      where: { name: Equal(permissionName) },
    });

    if (!persistedPermission) {
      throw new Error(`Permission could not be loaded: ${permissionName}`);
    }

    return persistedPermission;
  }

  private isUniqueViolationError({ error }: { error: unknown }): boolean {
    if (typeof error !== 'object' || !error) {
      return false;
    }

    return 'code' in error && error.code === PostgresStatusCodes.UNIQUE_VIOLATION;
  }
}
