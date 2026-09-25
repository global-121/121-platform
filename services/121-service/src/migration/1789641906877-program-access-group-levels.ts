import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProgramAccessGroupLevels1789641906877 implements MigrationInterface {
  name = 'ProgramAccessGroupLevels1789641906877';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_access_group_level" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "level" integer NOT NULL, "programId" integer NOT NULL, "programRegistrationAttributeId" integer NOT NULL, CONSTRAINT "programAccessGroupLevelUnique" UNIQUE ("programId", "level"), CONSTRAINT "programAccessGroupLevelAttributeUnique" UNIQUE ("programId", "programRegistrationAttributeId"), CONSTRAINT "PK_program_access_group_level" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_74bb1efb81827e0199bd2a3998" ON "121-service"."program_access_group_level" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_access_group_level" ADD CONSTRAINT "FK_79a35eb987997d3ca388c66ffe4" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_access_group_level" ADD CONSTRAINT "FK_e57ccd6b657be97a6f08c6ad09b" FOREIGN KEY ("programRegistrationAttributeId") REFERENCES "121-service"."program_registration_attribute"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`
      INSERT INTO "121-service"."permission" ("name")
      SELECT 'program:access-group-levels.update'
      WHERE NOT EXISTS (
        SELECT 1 FROM "121-service"."permission"
        WHERE "name" = 'program:access-group-levels.update'
      );
    `);

    // Grant the new permission to every role that already has 'program.update',
    // since scope used to be settable through that same permission.
    await queryRunner.query(`
      INSERT INTO "121-service"."user_role_permissions_permission" ("userRoleId", "permissionId")
      SELECT ur."id", p."id"
      FROM "121-service"."user_role" ur, "121-service"."permission" p
      WHERE p."name" = 'program:access-group-levels.update'
        AND EXISTS (
          SELECT 1
          FROM "121-service"."user_role_permissions_permission" urp
          INNER JOIN "121-service"."permission" permission
            ON permission."id" = urp."permissionId"
          WHERE urp."userRoleId" = ur."id"
            AND permission."name" = 'program.update'
        )
        AND NOT EXISTS (
          SELECT 1 FROM "121-service"."user_role_permissions_permission" urp
          WHERE urp."userRoleId" = ur."id"
            AND urp."permissionId" = p."id"
        );
    `);
  }

  public down(_queryRunner: QueryRunner): Promise<void> {
    return Promise.resolve();
  }
}
