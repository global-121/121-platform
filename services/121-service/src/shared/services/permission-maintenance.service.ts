import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { PostgresStatusCodes } from '@121-service/src/shared/enum/postgres-status-codes.enum';
import { PermissionEntity } from '@121-service/src/user/entities/permissions.entity';
import { UserRoleEntity } from '@121-service/src/user/entities/user-role.entity';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';

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

  public async syncAdminRolePermissions(): Promise<void> {
    const supportedPermissions = Object.values(PermissionEnum);
    const allPermissions = await this.permissionRepository.find();
    const permissionsByName = new Map(
      allPermissions.map((permission) => [permission.name, permission]),
    );
    const adminRole = await this.userRoleRepository.findOne({
      where: { role: Equal(DefaultUserRole.Admin) },
      relations: ['permissions'],
    });

    if (!adminRole) {
      return;
    }

    const adminPermissionNames = new Set(
      adminRole.permissions.map((permission) => permission.name),
    );
    let hasAdminRoleUpdates = false;

    for (const permissionName of supportedPermissions) {
      const permissionEntity = permissionsByName.get(permissionName);

      if (!permissionEntity) {
        continue;
      }

      const wasPermissionAdded = await this.ensureAdminHasPermission({
        adminRole,
        adminPermissionNames,
        permissionName,
        permissionEntity,
      });
      hasAdminRoleUpdates = hasAdminRoleUpdates || wasPermissionAdded;
    }

    if (hasAdminRoleUpdates) {
      await this.persistAdminRoleUpdates({ adminRole });
    }
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

  private async ensureAdminHasPermission({
    adminRole,
    adminPermissionNames,
    permissionName,
    permissionEntity,
  }: {
    adminRole: UserRoleEntity;
    adminPermissionNames: Set<PermissionEnum>;
    permissionName: PermissionEnum;
    permissionEntity: PermissionEntity;
  }): Promise<boolean> {
    if (adminPermissionNames.has(permissionName)) {
      return false;
    }

    adminRole.permissions.push(permissionEntity);

    adminPermissionNames.add(permissionName);
    return true;
  }

  private async persistAdminRoleUpdates({
    adminRole,
  }: {
    adminRole: UserRoleEntity;
  }): Promise<void> {
    try {
      await this.userRoleRepository.save(adminRole);
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
