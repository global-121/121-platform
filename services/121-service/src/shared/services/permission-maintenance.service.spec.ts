import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { PostgresStatusCodes } from '@121-service/src/shared/enum/postgres-status-codes.enum';
import { PermissionMaintenanceService } from '@121-service/src/shared/services/permission-maintenance.service';
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

function createAdminRoleEntity({
  permissions,
}: {
  permissions: PermissionEntity[];
}): UserRoleEntity {
  const userRole = new UserRoleEntity();
  userRole.id = 1;
  userRole.role = DefaultUserRole.Admin;
  userRole.permissions = [...permissions];
  return userRole;
}

function mockAdminRoleLookup({
  userRoleRepository,
  permissions,
}: {
  userRoleRepository: {
    findOne: jest.Mock;
  };
  permissions: PermissionEntity[] | null;
}): void {
  userRoleRepository.findOne.mockResolvedValue(
    permissions ? createAdminRoleEntity({ permissions }) : null,
  );
}

describe('PermissionMaintenanceService', () => {
  let service: PermissionMaintenanceService;
  let permissionRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let userRoleRepository: {
    findOne: jest.Mock;
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
      findOne: jest.fn(),
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

  it('does not perform writes when admin already has all supported permissions', async () => {
    const existingPermissions = getAllSupportedPermissions();

    permissionRepository.find.mockResolvedValue(existingPermissions);
    mockAdminRoleLookup({
      userRoleRepository,
      permissions: existingPermissions,
    });

    await service.syncAdminRolePermissions();

    expect(permissionRepository.save).not.toHaveBeenCalled();
    expect(userRoleRepository.save).not.toHaveBeenCalled();
  });

  it('returns without writes when admin role is missing', async () => {
    const existingPermissions = getAllSupportedPermissions();

    permissionRepository.find.mockResolvedValue(existingPermissions);
    mockAdminRoleLookup({
      userRoleRepository,
      permissions: null,
    });

    await service.syncAdminRolePermissions();

    expect(permissionRepository.save).not.toHaveBeenCalled();
    expect(userRoleRepository.save).not.toHaveBeenCalled();
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

  it('assigns any missing supported permission to admin', async () => {
    const { missingPermission, existingPermissions } =
      getMissingPermissionFixture();
    const missingPermissionEntity = createPermissionEntity({
      name: missingPermission,
    });
    const allPermissions = [...existingPermissions, missingPermissionEntity];

    permissionRepository.find.mockResolvedValue(allPermissions);
    mockAdminRoleLookup({
      userRoleRepository,
      permissions: existingPermissions,
    });

    await service.syncAdminRolePermissions();

    expect(userRoleRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: expect.arrayContaining([missingPermissionEntity]),
      }),
    );
  });

  it('skips missing permissions when admin sync runs without prior permission sync', async () => {
    const { existingPermissions } = getMissingPermissionFixture();

    permissionRepository.find.mockResolvedValue(existingPermissions);
    mockAdminRoleLookup({
      userRoleRepository,
      permissions: existingPermissions,
    });

    await service.syncAdminRolePermissions();

    expect(permissionRepository.save).not.toHaveBeenCalled();
    expect(userRoleRepository.save).not.toHaveBeenCalled();
  });

  it('does not fail when admin role save encounters a duplicate relation conflict', async () => {
    const { missingPermission, existingPermissions } =
      getMissingPermissionFixture();
    const allPermissions = [
      ...existingPermissions,
      createPermissionEntity({ name: missingPermission }),
    ];

    permissionRepository.find.mockResolvedValue(allPermissions);
    mockAdminRoleLookup({
      userRoleRepository,
      permissions: existingPermissions,
    });
    userRoleRepository.save.mockRejectedValueOnce({
      code: PostgresStatusCodes.UNIQUE_VIOLATION,
    });

    await expect(service.syncAdminRolePermissions()).resolves.toBeUndefined();
  });
});
