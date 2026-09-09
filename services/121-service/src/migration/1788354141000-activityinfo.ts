import { MigrationInterface, QueryRunner } from 'typeorm';

export class ActivityInfo1788354141000 implements MigrationInterface {
  name = 'ActivityInfo1788354141000';

  private readonly rolesGrantedActivityInfoPermissions = ['admin', 'program-admin'];

  private readonly activityInfoPermissions = [
    'program:activityinfo.read',
    'program:activityinfo.update',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."activityinfo" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "formId" character varying NOT NULL, "token" character varying NOT NULL, "schemaVersion" character varying NOT NULL, "url" character varying NOT NULL, "programId" integer NOT NULL, "name" character varying, CONSTRAINT "REL_activityinfo_programId" UNIQUE ("programId"), CONSTRAINT "PK_activityinfo_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activityinfo_created" ON "121-service"."activityinfo" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activityinfo_programId" ON "121-service"."activityinfo" ("programId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."activityinfo" ADD CONSTRAINT "FK_activityinfo_programId" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ADD "activityInfoLabel" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ADD "activityInfoFieldId" character varying`,
    );

    for (const role of this.rolesGrantedActivityInfoPermissions) {
      for (const permissionName of this.activityInfoPermissions) {
        await this.addPermissionToRole(queryRunner, { role, permissionName });
      }
    }
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

  public async down(): Promise<void> {
    throw new Error('Down migrations are not required.');
  }
}
