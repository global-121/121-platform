import { MigrationInterface, QueryRunner } from 'typeorm';

import {
  DEFAULT_USER_ROLES,
  DefaultUserRoleDefinition,
} from '@121-service/src/user/const/default-user-roles.const';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

interface RoleState {
  readonly id: number;
  readonly role: string;
  permissionNames: Set<string>;
}

interface DriftedDefaultRole {
  readonly defaultRole: DefaultUserRoleDefinition;
  readonly roleId: number;
  readonly originalPermissionNames: Set<string>;
  readonly assignmentIds: number[];
}

interface ReplacementRoleDefinition {
  readonly roleName: string;
  readonly label: string;
  readonly permissionNames: Set<string>;
  readonly replacesDefaultRole: boolean;
}

interface RoleReassignment {
  readonly defaultRoleId: number;
  readonly replacementRoleId: number;
  readonly replacesDefaultRole: boolean;
  readonly assignmentIds: number[];
}

/**
 * Resets all default roles to DEFAULT_USER_ROLES. Users of a drifted default
 * role keep their effective permissions via an (existing or new) custom role.
 */
export class SyncDefaultRoles1790861746910 implements MigrationInterface {
  name = 'SyncDefaultRoles1790861746910';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureDefaultRolePermissionsExist({ queryRunner });
    const permissionIdsByName = await this.getPermissionIdsByName({
      queryRunner,
    });
    const roles = await this.getRoles({ queryRunner });

    const driftedDefaultRoles = await this.resetDefaultRoles({
      queryRunner,
      roles,
      permissionIdsByName,
    });

    const reassignments: RoleReassignment[] = [];
    for (const driftedDefaultRole of driftedDefaultRoles) {
      reassignments.push(
        await this.createReassignment({
          queryRunner,
          roles,
          permissionIdsByName,
          driftedDefaultRole,
        }),
      );
    }

    // Unassign before assigning, so a default role reused as replacement keeps its new users
    for (const reassignment of reassignments) {
      if (!reassignment.replacesDefaultRole) {
        continue;
      }
      await this.unassignRole({
        queryRunner,
        roleId: reassignment.defaultRoleId,
        assignmentIds: reassignment.assignmentIds,
      });
    }
    for (const reassignment of reassignments) {
      await this.assignRole({
        queryRunner,
        roleId: reassignment.replacementRoleId,
        assignmentIds: reassignment.assignmentIds,
      });
    }
  }

  public async down(): Promise<void> {
    // Intentionally left empty: the previous role permissions are not stored.
    return;
  }

  private async ensureDefaultRolePermissionsExist({
    queryRunner,
  }: {
    queryRunner: QueryRunner;
  }): Promise<void> {
    const permissionNames = [
      ...new Set(DEFAULT_USER_ROLES.flatMap((role) => role.permissions)),
    ];

    await queryRunner.query(
      `INSERT INTO "121-service"."permission" ("name")
      SELECT unnest($1::varchar[])
      ON CONFLICT ("name") DO NOTHING`,
      [permissionNames],
    );
  }

  private async getPermissionIdsByName({
    queryRunner,
  }: {
    queryRunner: QueryRunner;
  }): Promise<Map<string, number>> {
    const permissions: { id: number; name: string }[] = await queryRunner.query(
      `SELECT "id", "name" FROM "121-service"."permission"`,
    );

    return new Map(
      permissions.map((permission) => [permission.name, permission.id]),
    );
  }

  private async getRoles({
    queryRunner,
  }: {
    queryRunner: QueryRunner;
  }): Promise<RoleState[]> {
    const roles: { id: number; role: string; permissionNames: string[] }[] =
      await queryRunner.query(
        `SELECT
          ur."id",
          ur."role",
          COALESCE(
            array_agg(p."name") FILTER (WHERE p."name" IS NOT NULL),
            '{}'
          ) AS "permissionNames"
        FROM "121-service"."user_role" ur
        LEFT JOIN "121-service"."user_role_permissions_permission" urpp
          ON urpp."userRoleId" = ur."id"
        LEFT JOIN "121-service"."permission" p
          ON p."id" = urpp."permissionId"
        GROUP BY ur."id", ur."role"`,
      );

    return roles.map((role) => ({
      id: role.id,
      role: role.role,
      permissionNames: new Set(role.permissionNames),
    }));
  }

  private async resetDefaultRoles({
    queryRunner,
    roles,
    permissionIdsByName,
  }: {
    queryRunner: QueryRunner;
    roles: RoleState[];
    permissionIdsByName: Map<string, number>;
  }): Promise<DriftedDefaultRole[]> {
    const driftedDefaultRoles: DriftedDefaultRole[] = [];
    const supportedPermissionNames = new Set<string>(
      Object.values(PermissionEnum),
    );

    for (const defaultRole of DEFAULT_USER_ROLES) {
      const existingRole = roles.find((role) => role.role === defaultRole.role);
      const defaultPermissionNames = new Set<string>(defaultRole.permissions);

      if (!existingRole) {
        const [createdRole]: { id: number }[] = await queryRunner.query(
          `INSERT INTO "121-service"."user_role" ("role", "label")
          VALUES ($1, $2)
          RETURNING "id"`,
          [defaultRole.role, defaultRole.label],
        );
        await this.setRolePermissions({
          queryRunner,
          roleId: createdRole.id,
          permissionNames: defaultPermissionNames,
          permissionIdsByName,
        });
        roles.push({
          id: createdRole.id,
          role: defaultRole.role,
          permissionNames: defaultPermissionNames,
        });
        continue;
      }

      await queryRunner.query(
        `UPDATE "121-service"."user_role" SET "label" = $1 WHERE "id" = $2`,
        [defaultRole.label, existingRole.id],
      );

      if (
        isSameSet({ a: existingRole.permissionNames, b: defaultPermissionNames })
      ) {
        continue;
      }

      const originalPermissionNames = new Set(
        [...existingRole.permissionNames].filter((permissionName) =>
          supportedPermissionNames.has(permissionName),
        ),
      );
      if (!isSameSet({ a: originalPermissionNames, b: defaultPermissionNames })) {
        driftedDefaultRoles.push({
          defaultRole,
          roleId: existingRole.id,
          originalPermissionNames,
          assignmentIds: await this.getAssignmentIds({
            queryRunner,
            roleId: existingRole.id,
          }),
        });
      }

      await this.setRolePermissions({
        queryRunner,
        roleId: existingRole.id,
        permissionNames: defaultPermissionNames,
        permissionIdsByName,
      });
      existingRole.permissionNames = defaultPermissionNames;
    }

    return driftedDefaultRoles;
  }

  private async getAssignmentIds({
    queryRunner,
    roleId,
  }: {
    queryRunner: QueryRunner;
    roleId: number;
  }): Promise<number[]> {
    const assignments: { programAidworkerAssignmentId: number }[] =
      await queryRunner.query(
        `SELECT "programAidworkerAssignmentId"
        FROM "121-service"."program_aidworker_assignment_roles_user_role"
        WHERE "userRoleId" = $1`,
        [roleId],
      );

    return assignments.map(
      (assignment) => assignment.programAidworkerAssignmentId,
    );
  }

  private async setRolePermissions({
    queryRunner,
    roleId,
    permissionNames,
    permissionIdsByName,
  }: {
    queryRunner: QueryRunner;
    roleId: number;
    permissionNames: Set<string>;
    permissionIdsByName: Map<string, number>;
  }): Promise<void> {
    const permissionIds = [...permissionNames]
      .map((permissionName) => permissionIdsByName.get(permissionName))
      .filter((permissionId) => permissionId !== undefined);

    await queryRunner.query(
      `DELETE FROM "121-service"."user_role_permissions_permission"
      WHERE "userRoleId" = $1`,
      [roleId],
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."user_role_permissions_permission" ("userRoleId", "permissionId")
      SELECT $1, unnest($2::int[])`,
      [roleId, permissionIds],
    );
  }

  private async createReassignment({
    queryRunner,
    roles,
    permissionIdsByName,
    driftedDefaultRole,
  }: {
    queryRunner: QueryRunner;
    roles: RoleState[];
    permissionIdsByName: Map<string, number>;
    driftedDefaultRole: DriftedDefaultRole;
  }): Promise<RoleReassignment> {
    const replacementRole = this.getReplacementRoleDefinition({
      driftedDefaultRole,
    });
    const replacementRoleId = await this.findOrCreateRole({
      queryRunner,
      roles,
      permissionIdsByName,
      replacementRole,
    });

    return {
      defaultRoleId: driftedDefaultRole.roleId,
      replacementRoleId,
      replacesDefaultRole: replacementRole.replacesDefaultRole,
      assignmentIds: driftedDefaultRole.assignmentIds,
    };
  }

  private getReplacementRoleDefinition({
    driftedDefaultRole,
  }: {
    driftedDefaultRole: DriftedDefaultRole;
  }): ReplacementRoleDefinition {
    const { defaultRole, originalPermissionNames } = driftedDefaultRole;
    const hasRemovedPermissions = defaultRole.permissions.some(
      (permissionName) => !originalPermissionNames.has(permissionName),
    );

    if (hasRemovedPermissions) {
      return {
        roleName: `${defaultRole.role}-custom`,
        label: `${defaultRole.label} (custom)`,
        permissionNames: originalPermissionNames,
        replacesDefaultRole: true,
      };
    }

    const defaultPermissionNames = new Set<string>(defaultRole.permissions);
    const addedPermissionNames = [...originalPermissionNames].filter(
      (permissionName) => !defaultPermissionNames.has(permissionName),
    );

    return {
      roleName: `${defaultRole.role}-additions`,
      label: addedPermissionNames.join(', '),
      permissionNames: new Set(addedPermissionNames),
      replacesDefaultRole: false,
    };
  }

  private async findOrCreateRole({
    queryRunner,
    roles,
    permissionIdsByName,
    replacementRole,
  }: {
    queryRunner: QueryRunner;
    roles: RoleState[];
    permissionIdsByName: Map<string, number>;
    replacementRole: ReplacementRoleDefinition;
  }): Promise<number> {
    const roleWithSamePermissions = roles.find((role) =>
      isSameSet({ a: role.permissionNames, b: replacementRole.permissionNames }),
    );

    if (roleWithSamePermissions) {
      return roleWithSamePermissions.id;
    }

    const roleName = this.getAvailableRoleName({
      roles,
      roleName: replacementRole.roleName,
    });
    const [createdRole]: { id: number }[] = await queryRunner.query(
      `INSERT INTO "121-service"."user_role" ("role", "label")
      VALUES ($1, $2)
      RETURNING "id"`,
      [roleName, replacementRole.label],
    );
    await this.setRolePermissions({
      queryRunner,
      roleId: createdRole.id,
      permissionNames: replacementRole.permissionNames,
      permissionIdsByName,
    });
    roles.push({
      id: createdRole.id,
      role: roleName,
      permissionNames: replacementRole.permissionNames,
    });

    return createdRole.id;
  }

  private getAvailableRoleName({
    roles,
    roleName,
  }: {
    roles: RoleState[];
    roleName: string;
  }): string {
    const existingRoleNames = new Set(roles.map((role) => role.role));
    let availableRoleName = roleName;
    let suffix = 2;

    while (existingRoleNames.has(availableRoleName)) {
      availableRoleName = `${roleName}-${suffix}`;
      suffix++;
    }

    return availableRoleName;
  }

  private async unassignRole({
    queryRunner,
    roleId,
    assignmentIds,
  }: {
    queryRunner: QueryRunner;
    roleId: number;
    assignmentIds: number[];
  }): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."program_aidworker_assignment_roles_user_role"
      WHERE "userRoleId" = $1 AND "programAidworkerAssignmentId" = ANY($2::int[])`,
      [roleId, assignmentIds],
    );
  }

  private async assignRole({
    queryRunner,
    roleId,
    assignmentIds,
  }: {
    queryRunner: QueryRunner;
    roleId: number;
    assignmentIds: number[];
  }): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "121-service"."program_aidworker_assignment_roles_user_role" ("programAidworkerAssignmentId", "userRoleId")
      SELECT unnest($1::int[]), $2
      ON CONFLICT DO NOTHING`,
      [assignmentIds, roleId],
    );
  }
}

function isSameSet({ a, b }: { a: Set<string>; b: Set<string> }): boolean {
  if (a.size !== b.size) {
    return false;
  }

  return [...a].every((value) => b.has(value));
}
