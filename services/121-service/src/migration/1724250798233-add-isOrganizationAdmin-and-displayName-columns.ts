import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsOrganizationAdminAndDisplayNameColumns1724250798233
  implements MigrationInterface
{
  name = 'AddIsOrganizationAdminAndDisplayNameColumns1724250798233';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."user" ADD "isOrganizationAdmin" boolean NOT NULL DEFAULT false`,
    );
    // Set all current admin users also as organization admins
    await queryRunner.query(`
      UPDATE "121-service"."user"
      SET "isOrganizationAdmin" = true WHERE "isAdmin" = true
    `);

    await queryRunner.query(
      `ALTER TABLE "121-service"."user" ADD "displayName" character varying`,
    );
    await queryRunner.query(`
      UPDATE "121-service"."user"
      SET "displayName" = substring("username" from '^[^@]+')
    `);
    await queryRunner.query(
      `ALTER TABLE "121-service"."user" ALTER COLUMN "displayName" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."user" DROP COLUMN "isOrganizationAdmin"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user" DROP COLUMN "displayName"`,
    );
  }
}
