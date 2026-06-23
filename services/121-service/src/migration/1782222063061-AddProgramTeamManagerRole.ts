import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProgramTeamManagerRole1782222063061 implements MigrationInterface {
  name = 'AddProgramTeamManagerRole1782222063061';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create the new "program-team-manager" default role (if it does not exist yet).
    await queryRunner.query(
      `
      INSERT INTO "121-service"."user_role" ("role", "label")
      SELECT 'program-team-manager', 'Program Team Manager'
      WHERE NOT EXISTS (
        SELECT 1 FROM "121-service"."user_role" WHERE "role" = 'program-team-manager'
      );
    `,
    );

    // 2. Assign the default permissions to the new "program-team-manager" role.
    const programTeamManagerPermissions = [
      'program:metrics.read',
      'payment.read',
      'payment:transaction.read',
      'registration.read',
      'registration:notification.read',
      'aid-worker:program.read',
      'aid-worker:program.update',
    ];
    for (const permissionName of programTeamManagerPermissions) {
      await this.addPermissionToRole(queryRunner, {
        role: 'program-team-manager',
        permissionName,
      });
    }

    // 3. Update the "cva-manager" role permissions to match the new defaults:
    //    add "registration:bulk.update" and remove "aid-worker:program.update".
    await this.addPermissionToRole(queryRunner, {
      role: 'cva-manager',
      permissionName: 'registration:bulk.update',
    });
    await this.removePermissionFromRole(queryRunner, {
      role: 'cva-manager',
      permissionName: 'aid-worker:program.update',
    });
  }

  private async addPermissionToRole(
    queryRunner: QueryRunner,
    { role, permissionName }: { role: string; permissionName: string },
  ): Promise<void> {
    // Make sure the permission exists.
    await queryRunner.query(
      `
      INSERT INTO "121-service"."permission" ("name")
      SELECT $1::VARCHAR
      WHERE NOT EXISTS (
        SELECT 1 FROM "121-service"."permission" WHERE "name" = $1
      );
    `,
      [permissionName],
    );

    // Link the permission to the role (if not already linked).
    await queryRunner.query(
      `
      INSERT INTO "121-service"."user_role_permissions_permission" ("userRoleId", "permissionId")
      SELECT ur."id", p."id"
      FROM "121-service"."user_role" ur, "121-service"."permission" p
      WHERE ur."role" = $1
        AND p."name" = $2
        AND NOT EXISTS (
          SELECT 1 FROM "121-service"."user_role_permissions_permission" urp
          WHERE urp."userRoleId" = ur."id" AND urp."permissionId" = p."id"
        );
    `,
      [role, permissionName],
    );
  }

  private async removePermissionFromRole(
    queryRunner: QueryRunner,
    { role, permissionName }: { role: string; permissionName: string },
  ): Promise<void> {
    await queryRunner.query(
      `
      DELETE FROM "121-service"."user_role_permissions_permission" urp
      USING "121-service"."user_role" ur, "121-service"."permission" p
      WHERE urp."userRoleId" = ur."id"
        AND urp."permissionId" = p."id"
        AND ur."role" = $1
        AND p."name" = $2;
    `,
      [role, permissionName],
    );
  }

  public async down(): Promise<void> {
    throw new Error('Down migrations are not required.');
  }
}
