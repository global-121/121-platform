import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { PostgresStatusCodes } from '@121-service/src/shared/enum/postgres-status-codes.enum';
import { PermissionMaintenanceService } from '@121-service/src/shared/services/permission-maintenance.service';
import {
  DEFAULT_USER_ROLES,
  DefaultUserRoleDefinition,
} from '@121-service/src/user/const/default-user-roles.const';
import { PermissionEntity } from '@121-service/src/user/entities/permissions.entity';
import { UserRoleEntity } from '@121-service/src/user/entities/user-role.entity';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';

function createPermissionEntity({
  name,
}: {
  name: PermissionEnum;
}): PermissionEntity {
  const permission = new PermissionEntity();
  const permissionEnumValues = Object.values(PermissionEnum);
  permission.id = permissionEnumValues.indexOf(name) + 1;
  permission.name = name;
  return permission;
}

function getAllSupportedPermissions(): PermissionEntity[] {
  return Object.values(PermissionEnum).map((permission) =>
    createPermissionEntity({ name: permission }),
  );
}

function getMissingPermissionFixture(): {
  missingPermission: PermissionEnum;
  existingPermissions: PermissionEntity[];
} {
  const [missingPermission, ...existingPermissionNames] = Object.values(
    PermissionEnum,
  ) as PermissionEnum[];

  return {
    missingPermission,
    existingPermissions: existingPermissionNames.map((permission) =>
      createPermissionEntity({ name: permission }),
    ),
  };
}

function createDefaultRoleEntities(): UserRoleEntity[] {
  const permissionsByName = new Map(
    getAllSupportedPermissions().map((permission) => [
      permission.name,
      permission,
    ]),
  );

  return DEFAULT_USER_ROLES.map((definition, index) => {
    const userRole = new UserRoleEntity();
    userRole.id = index + 1;
    userRole.role = definition.role;
    userRole.label = definition.label;
    userRole.permissions = definition.permissions
      .map((permissionName) => permissionsByName.get(permissionName))
      .filter((permission) => permission !== undefined);
    return userRole;
  });
}

function getDefaultRoleDefinition({
  role,
}: {
  role: DefaultUserRole;
}): DefaultUserRoleDefinition {
  return DEFAULT_USER_ROLES.find(
    (definition) => definition.role === role,
  ) as DefaultUserRoleDefinition;
}

describe('PermissionMaintenanceService', () => {
  let service: PermissionMaintenanceService;
  let permissionRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let userRoleRepository: {
    find: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    permissionRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn().mockImplementation(async (permission: PermissionEntity) => {
        const savedPermission = new PermissionEntity();
        savedPermission.id = permission.id;
        savedPermission.name = permission.name;
        return savedPermission;
      }),
    };

    userRoleRepository = {
      find: jest.fn(),
      save: jest.fn().mockImplementation(async (role: UserRoleEntity) => role),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PermissionMaintenanceService,
        {
          provide: getRepositoryToken(PermissionEntity),
          useValue: permissionRepository,
        },
        {
          provide: getRepositoryToken(UserRoleEntity),
          useValue: userRoleRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(PermissionMaintenanceService);
  });

  it('does not perform writes when all default roles are in sync', async () => {
    const existingPermissions = getAllSupportedPermissions();
    const customRole = new UserRoleEntity();
    customRole.role = 'custom-role';
    customRole.permissions = [];

    permissionRepository.find.mockResolvedValue(existingPermissions);
    userRoleRepository.find.mockResolvedValue([
      ...createDefaultRoleEntities(),
      customRole,
    ]);

    await service.syncDefaultRoles();

    expect(permissionRepository.save).not.toHaveBeenCalled();
    expect(userRoleRepository.save).not.toHaveBeenCalled();
  });

  it('creates a default role when it is missing', async () => {
    const existingPermissions = getAllSupportedPermissions();
    const rolesWithoutAdmin = createDefaultRoleEntities().filter(
      (role) => role.role !== DefaultUserRole.Admin,
    );

    permissionRepository.find.mockResolvedValue(existingPermissions);
    userRoleRepository.find.mockResolvedValue(rolesWithoutAdmin);

    await service.syncDefaultRoles();

    expect(userRoleRepository.save).toHaveBeenCalledTimes(1);
    const savedRole = userRoleRepository.save.mock
      .calls[0][0] as UserRoleEntity;
    expect(savedRole.role).toBe(DefaultUserRole.Admin);
    expect(savedRole.label).toBe('Admin');
    expect(savedRole.permissions).toHaveLength(
      Object.values(PermissionEnum).length,
    );
  });

  it('creates missing supported permissions before continuing', async () => {
    const { missingPermission, existingPermissions } =
      getMissingPermissionFixture();

    permissionRepository.find.mockResolvedValue(existingPermissions);
    permissionRepository.findOne.mockResolvedValueOnce(null);
    permissionRepository.save.mockResolvedValue(
      createPermissionEntity({ name: missingPermission }),
    );

    await service.syncSupportedPermissions();

    expect(permissionRepository.save).toHaveBeenCalledTimes(1);
    expect(permissionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: missingPermission }),
    );
    expect(userRoleRepository.save).not.toHaveBeenCalled();
  });

  it('re-syncs a default role whose permissions have drifted', async () => {
    const existingPermissions = getAllSupportedPermissions();
    const defaultRoles = createDefaultRoleEntities();
    const viewRole = defaultRoles.find(
      (role) => role.role === DefaultUserRole.View,
    ) as UserRoleEntity;
    const viewDefinition = getDefaultRoleDefinition({
      role: DefaultUserRole.View,
    });
    const extraPermission = createPermissionEntity({
      name: PermissionEnum.PaymentSTART,
    });
    viewRole.permissions = [...viewRole.permissions.slice(1), extraPermission];

    permissionRepository.find.mockResolvedValue(existingPermissions);
    userRoleRepository.find.mockResolvedValue(defaultRoles);

    await service.syncDefaultRoles();

    expect(userRoleRepository.save).toHaveBeenCalledTimes(1);
    const savedRole = userRoleRepository.save.mock
      .calls[0][0] as UserRoleEntity;
    expect(savedRole.role).toBe(DefaultUserRole.View);
    expect(savedRole.permissions).toHaveLength(
      viewDefinition.permissions.length,
    );
    expect(savedRole.permissions).not.toContain(extraPermission);
  });

  it('re-syncs the label of a default role when it has drifted', async () => {
    const existingPermissions = getAllSupportedPermissions();
    const defaultRoles = createDefaultRoleEntities();
    defaultRoles[0].label = 'Outdated label';

    permissionRepository.find.mockResolvedValue(existingPermissions);
    userRoleRepository.find.mockResolvedValue(defaultRoles);

    await service.syncDefaultRoles();

    expect(userRoleRepository.save).toHaveBeenCalledTimes(1);
    expect(userRoleRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        role: DefaultUserRole.Admin,
        label: 'Admin',
      }),
    );
  });

  it('does not fail when a default role save encounters a duplicate relation conflict', async () => {
    const existingPermissions = getAllSupportedPermissions();
    const defaultRoles = createDefaultRoleEntities();
    defaultRoles[0].label = 'Outdated label';

    permissionRepository.find.mockResolvedValue(existingPermissions);
    userRoleRepository.find.mockResolvedValue(defaultRoles);
    userRoleRepository.save.mockRejectedValueOnce({
      code: PostgresStatusCodes.UNIQUE_VIOLATION,
    });

    await expect(service.syncDefaultRoles()).resolves.toBeUndefined();
  });
});
