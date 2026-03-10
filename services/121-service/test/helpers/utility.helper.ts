import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import TestAgent from 'supertest/lib/agent';

import { env } from '@121-service/src/env';
import { ApproverSeedMode } from '@121-service/src/scripts/enum/approval-seed-mode.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { CookieNames } from '@121-service/src/shared/enum/cookie.enums';
import { CreateProgramAssignmentDto } from '@121-service/src/user/dto/assign-aw-to-program.dto';
import { CreateUsersDto } from '@121-service/src/user/dto/create-user.dto';
import { CreateUserRoleDto } from '@121-service/src/user/dto/create-user-role.dto';
import { UpdateUserRoleDto } from '@121-service/src/user/dto/update-user-role.dto';
import { UserRoleResponseDTO } from '@121-service/src/user/dto/userrole-response.dto';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';

export function getHostname(): string {
  return `${env.EXTERNAL_121_SERVICE_URL}/api`;
}

export function getServer(): TestAgent<request.Test> {
  return request.agent(getHostname());
}

export function getMockServer(): TestAgent<request.Test> {
  return request.agent(`${env.MOCK_SERVICE_URL}/api`);
}

export function resetDB(
  seedScript: SeedScript,
  resetIdentifier: string,
  includeRegistrationEvents = false,
  approverMode?: ApproverSeedMode,
): Promise<request.Response> {
  return getServer()
    .post('/scripts/reset')
    .query({
      script: seedScript,
      isApiTests: true,
      includeRegistrationEvents,
      resetIdentifier,
      approverMode,
    })
    .send({
      secret: env.RESET_SECRET,
    });
}

export function resetDuplicateRegistrations(
  mockNumber: number,
): Promise<request.Response> {
  return getServer()
    .post('/scripts/duplicate-registrations')
    .query({
      mockPowerNumberRegistrations: mockNumber,
    })
    .send({
      secret: env.RESET_SECRET,
    });
}

export function loginApi(
  username: string,
  password: string,
): Promise<request.Response> {
  return getServer().post(`/users/login`).send({
    username,
    password,
  });
}

export async function logoutUser(
  accessToken: string,
): Promise<request.Response> {
  return getServer().post('/users/logout').set('Cookie', [accessToken]).send();
}

export async function getAccessToken(
  username = env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
  password = env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
): Promise<string> {
  const login = await loginApi(username, password);

  if (login.statusCode !== HttpStatus.CREATED) {
    throw new Error(`Login failed with status code: ${login.statusCode}`);
  }

  const cookies = login.get('Set-Cookie');
  const accessToken = cookies
    ?.find((cookie: string) => cookie.startsWith(CookieNames.general))
    ?.split(';')[0];

  if (!accessToken) {
    throw new Error('Access token not found');
  }

  return accessToken;
}

export async function getAccessTokenScoped(
  defaultScope: DebugScope,
): Promise<string> {
  return await getAccessToken(
    `${defaultScope}@example.org`,
    env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
}

export async function getAccessTokenCvaManager(): Promise<string> {
  return await getAccessToken(
    env.USERCONFIG_121_SERVICE_EMAIL_CVA_MANAGER,
    env.USERCONFIG_121_SERVICE_PASSWORD_CVA_MANAGER,
  );
}

export async function getAccessTokenFinanceManager(): Promise<string> {
  return await getAccessToken(
    env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER,
    env.USERCONFIG_121_SERVICE_PASSWORD_FINANCE_MANAGER,
  );
}

export async function removeProgramAssignment(
  programId: number,
  userId: number,
  accessToken: string,
): Promise<request.Response> {
  return getServer()
    .delete(`/programs/${programId}/users/${userId}`)
    .set('Cookie', [accessToken])
    .send();
}

export async function runCronJobDoNedbankReconciliation(): Promise<request.Response> {
  const accessToken = await getAccessToken();
  return await getServer()
    .patch('/cronjobs/fsps/nedbank')
    .set('Cookie', [accessToken]);
}

export async function updatePermissionsOfRole(
  userRoleId: number,
  roleToUpdate: UpdateUserRoleDto,
): Promise<void> {
  const accessToken = await getAccessToken();
  await getServer()
    .put(`/roles/${userRoleId}`)
    .set('Cookie', [accessToken])
    .send(roleToUpdate);
}
export async function addPermissionToRole(
  roleName: DefaultUserRole,
  permissionsToAdd: PermissionEnum[],
): Promise<void> {
  const role = await getRole(roleName);
  const permissionSet = new Set(role.permissions || []);
  permissionsToAdd.forEach((permission) => permissionSet.add(permission));
  const updatedPermissions = Array.from(permissionSet) as PermissionEnum[];
  await updatePermissionsOfRole(role.id, {
    permissions: updatedPermissions,
  });
}

export async function getRole(type: string): Promise<UserRoleResponseDTO> {
  const accessToken = await getAccessToken();
  const allRolesResponse = await getServer()
    .get(`/roles/`)
    .set('Cookie', [accessToken])
    .send();

  const allRoles = allRolesResponse.body;

  return allRoles.find((role: UserRoleResponseDTO) => role.role === type);
}

export async function createRole({
  roleName,
  label,
  description,
  permissions,
  adminAccessToken,
}: {
  roleName: string;
  label: string;
  description: string;
  permissions: PermissionEnum[];
  adminAccessToken: string;
}): Promise<number> {
  const createRoleDto: CreateUserRoleDto = {
    role: roleName,
    label,
    description,
    permissions,
  };

  const createRoleResponse = await getServer()
    .post('/roles')
    .set('Cookie', [adminAccessToken])
    .send(createRoleDto);

  if (createRoleResponse.status !== HttpStatus.CREATED) {
    throw new Error(
      `Failed to create role: ${createRoleResponse.status} - ${JSON.stringify(createRoleResponse.body)}`,
    );
  }

  return createRoleResponse.body.id;
}

export async function createUser({
  username,
  displayName,
  adminAccessToken,
}: {
  username: string;
  displayName: string;
  adminAccessToken: string;
}): Promise<void> {
  const createUserDto: CreateUsersDto = {
    users: [
      {
        username,
        displayName,
      },
    ],
  };

  const createUserResponse = await getServer()
    .post('/users')
    .set('Cookie', [adminAccessToken])
    .send(createUserDto);

  if (createUserResponse.status !== HttpStatus.NO_CONTENT) {
    throw new Error(
      `Failed to create user: ${createUserResponse.status} - ${JSON.stringify(createUserResponse.body)}`,
    );
  }
}

/**
 * Searches for a user by username within a program context
 */
export async function findUserByUsername({
  programId,
  username,
  adminAccessToken,
}: {
  programId: number;
  username: string;
  adminAccessToken: string;
}): Promise<number> {
  const searchUserResponse = await getServer()
    .get(`/programs/${programId}/users/search`)
    .set('Cookie', [adminAccessToken])
    .query({ username });

  if (
    searchUserResponse.status !== HttpStatus.OK ||
    !searchUserResponse.body.length
  ) {
    throw new Error(
      `Failed to find created user: ${searchUserResponse.status}`,
    );
  }

  return searchUserResponse.body[0].id;
}

export async function assignUserToProgram({
  programId,
  userId,
  roles,
  scope,
  adminAccessToken,
}: {
  programId: number;
  userId: number;
  roles: string[];
  scope?: string;
  adminAccessToken: string;
}): Promise<void> {
  const assignmentDto: CreateProgramAssignmentDto = {
    roles: roles as DefaultUserRole[],
    scope,
  };

  const assignmentResponse = await getServer()
    .put(`/programs/${programId}/users/${userId}`)
    .set('Cookie', [adminAccessToken])
    .send(assignmentDto);

  if (assignmentResponse.status !== HttpStatus.OK) {
    throw new Error(
      `Failed to assign user to program: ${assignmentResponse.status} - ${JSON.stringify(assignmentResponse.body)}`,
    );
  }
}

export async function createUserWithPermissions({
  permissions,
  programId,
  adminAccessToken,
  scope,
}: {
  permissions: PermissionEnum[];
  programId: number;
  adminAccessToken: string;
  scope?: string;
}): Promise<string> {
  // Generate unique identifiers
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(7);
  const roleName = `test_role_${timestamp}_${randomSuffix}`;
  const username = `test_user_${timestamp}_${randomSuffix}@example.org`;
  const displayName = `Test User ${timestamp}`;

  await createRole({
    roleName,
    label: `Test Role ${timestamp}`,
    description: `Automatically created test role with permissions: ${permissions.join(', ')}`,
    permissions,
    adminAccessToken,
  });

  await createUser({
    username,
    displayName,
    adminAccessToken,
  });

  const userId = await findUserByUsername({
    programId,
    username,
    adminAccessToken,
  });

  // Assign user to program with the custom role
  await assignUserToProgram({
    programId,
    userId,
    roles: [roleName],
    scope,
    adminAccessToken,
  });

  return username;
}

export async function createAccessTokenWithPermissions({
  permissions,
  adminAccessToken,
  programId,
  scope,
}: {
  permissions: PermissionEnum[];
  adminAccessToken: string;
  programId: number;
  scope?: string;
}): Promise<string> {
  const username = await createUserWithPermissions({
    permissions,
    programId,
    adminAccessToken,
    scope,
  });
  return getAccessToken(username, env.USERCONFIG_121_SERVICE_PASSWORD_TESTING);
}

function removeNestedProperties<T extends object>(
  obj: T,
  keysToIgnore: string[],
): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => removeNestedProperties(item, keysToIgnore)) as T;
  }

  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  return Object.keys(obj).reduce((acc, key) => {
    if (keysToIgnore.includes(key)) {
      return acc;
    }
    return {
      ...acc,
      [key]: removeNestedProperties(obj[key], keysToIgnore),
    };
  }, {}) as T;
}

function sortByAttribute(attribute: string) {
  return function (a: Record<string, string>, b: Record<string, string>) {
    return a[attribute].localeCompare(b[attribute]);
  };
}

/**
 * This function was created because the order of the attributes in the
 * program object is not consistent.
 *
 * The assumption is that the order changes are not relevant for the test,
 * and are caused by some database-related reason that we do not control nor care about.
 *
 * Beyond sorting the attributes, this function also removes certain
 * attributes that always change and that are also irrelevant for the test.
 */
export function cleanProgramForAssertions(originalProgram: any): any {
  const program = removeNestedProperties(originalProgram, [
    'configuration',
    'startDate',
    'endDate',
    'updated',
    'created',
    'programFspConfigurations',
    'fspConfigurations',
  ]);

  const attributesToSort = [
    { attribute: 'editableAttributes', key: 'name' },
    { attribute: 'paTableAttributes', key: 'name' },
    { attribute: 'fsps', key: 'fsp' },
    { attribute: 'programRegistrationAttributes', key: 'name' },
    { attribute: 'filterableAttributes', key: 'group' },
  ];

  attributesToSort.forEach(({ attribute, key }) => {
    if (program[attribute]) {
      program[attribute] = program[attribute].sort(sortByAttribute(key));
    }
  });

  if (program.filterableAttributes) {
    program.filterableAttributes = program.filterableAttributes.map(
      (filterableAttribute: any) => {
        return {
          ...filterableAttribute,
          filters: filterableAttribute.filters.sort(sortByAttribute('name')),
        };
      },
    );
  }

  return program;
}
