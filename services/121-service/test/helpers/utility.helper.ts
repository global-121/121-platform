import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { CookieNames } from '@121-service/src/shared/enum/cookie.enums';
import { UpdateUserRoleDto } from '@121-service/src/user/dto/user-role.dto';
import { UserRoleResponseDTO } from '@121-service/src/user/dto/userrole-response.dto';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/user-role.enum';
import * as request from 'supertest';
import TestAgent from 'supertest/lib/agent';

export function getHostname(): string {
  return 'http://localhost:3000/api';
}

export function getServer(): TestAgent<request.Test> {
  return request.agent(getHostname());
}

export function resetDB(seedScript: SeedScript): Promise<request.Response> {
  return getServer()
    .post('/scripts/reset')
    .query({
      script: seedScript,
      isApiTests: true,
    })
    .send({
      secret: process.env.RESET_SECRET,
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

export async function getAccessToken(
  username = process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN!,
  password = process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN!,
): Promise<string> {
  const login = await loginApi(username, password);
  const cookies = login.get('Set-Cookie');
  const accessToken = cookies
    ?.find((cookie: string) => cookie.startsWith(CookieNames.general))
    ?.split(';')[0];

  if (!accessToken) {
    throw new Error('Access token not found');
  }

  return accessToken;
}

export async function getAccessTokenProgramManager(): Promise<string> {
  return await getAccessToken(
    process.env.USERCONFIG_121_SERVICE_EMAIL_USER_RUN_PROGRAM,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_RUN_PROGRAM,
  );
}

export async function getAccessTokenScoped(
  defaultScope: DebugScope,
): Promise<string> {
  return await getAccessToken(
    `${defaultScope}@example.org`,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
}

export async function getAccessTokenCvaManager(): Promise<string> {
  return await getAccessToken(
    process.env.USERCONFIG_121_SERVICE_EMAIL_CVA_MANAGER,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_CVA_MANAGER,
  );
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

export async function getRole(type: string): Promise<UserRoleResponseDTO> {
  const accessToken = await getAccessToken();
  const allRolesResponse = await getServer()
    .get(`/roles/`)
    .set('Cookie', [accessToken])
    .send();

  const allRoles = allRolesResponse.body;

  return allRoles.find((role: UserRoleResponseDTO) => role.role === type);
}

export async function removePermissionsFromRole(
  roleName: DefaultUserRole,
  permissionsToRemove: PermissionEnum[],
): Promise<void> {
  const role = await getRole(roleName);
  const adjustedPermissions = role.permissions?.filter(
    (permission: PermissionEnum) => !permissionsToRemove.includes(permission),
  );
  await updatePermissionsOfRole(role.id, {
    label: role.label!,
    permissions: adjustedPermissions as PermissionEnum[],
  });
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
  ]);

  const attributesToSort = [
    { attribute: 'editableAttributes', key: 'name' },
    { attribute: 'paTableAttributes', key: 'name' },
    { attribute: 'financialServiceProviders', key: 'fsp' },
    { attribute: 'programQuestions', key: 'name' },
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

  if (program.financialServiceProviders) {
    program.financialServiceProviders = program.financialServiceProviders.map(
      (financialServiceProvider: any) => {
        if (!financialServiceProvider.questions) {
          return financialServiceProvider;
        }

        return {
          ...financialServiceProvider,
          questions: financialServiceProvider.questions.sort(
            sortByAttribute('name'),
          ),
        };
      },
    );
  }

  return program;
}
