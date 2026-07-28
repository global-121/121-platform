import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncProgramAdminRolePermissions1785100000000
  implements MigrationInterface
{
  name = 'SyncProgramAdminRolePermissions1785100000000';

  private readonly role = 'program-admin';

  private readonly targetPermissions = [
    'aid-worker:program.read',
    'aid-worker:program.update',
    'payment.read',
    'program:approval-thresholds.read',
    'program:approval-thresholds.update',
    'program:attachments.create',
    'program:attachments.delete',
    'program:attachments.read',
    'program:attachments.update',
    'program:fsp-config.create',
    'program:fsp-config.delete',
    'program:fsp-config.read',
    'program:fsp-config.update',
    'program:kobo.read',
    'program:kobo.update',
    'program:metrics.read',
    'program.read',
    'program:registration-attributes.create',
    'program:registration-attributes.delete',
    'program:registration-attributes.update',
    'program.update',
    'registration.read',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const permissionName of this.targetPermissions) {
      await this.addPermissionToRole(queryRunner, {
        role: this.role,
        permissionName,
      });
    }

    await this.removePermissionsNotInTargetSet(queryRunner, {
      role: this.role,
      targetPermissions: this.targetPermissions,
    });
  }

  private async addPermissionToRole(
    queryRunner: QueryRunner,
    { role, permissionName }: { role: string; permissionName: string },
  ): Promise<void> {
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

    await queryRunner.query(
      `
      INSERT INTO "121-service"."user_role_permissions_permission" ("userRoleId", "permissionId")
      SELECT ur."id", p."id"
      FROM "121-service"."user_role" ur, "121-service"."permission" p
      WHERE ur."role" = $1
        AND p."name" = $2
        AND NOT EXISTS (
          SELECT 1 FROM "121-service"."user_role_permissions_permission" urp
          WHERE urp."userRoleId" = ur."id"
            AND urp."permissionId" = p."id"
        );
      `,
      [role, permissionName],
    );
  }

  private async removePermissionsNotInTargetSet(
    queryRunner: QueryRunner,
    {
      role,
      targetPermissions,
    }: { role: string; targetPermissions: string[] },
  ): Promise<void> {
    await queryRunner.query(
      `
      DELETE FROM "121-service"."user_role_permissions_permission" urp
      USING "121-service"."user_role" ur, "121-service"."permission" p
      WHERE urp."userRoleId" = ur."id"
        AND urp."permissionId" = p."id"
        AND ur."role" = $1
        AND NOT (p."name" = ANY($2::VARCHAR[]));
      `,
      [role, targetPermissions],
    );
  }

  public async down(): Promise<void> {
    throw new Error('Down migrations are not required.');
  }
}
