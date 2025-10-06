import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropOrganizationTable1759745805696 implements MigrationInterface {
  name = 'DropOrganizationTable1759745805696';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "121-service"."organization"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the organization table if needed to rollback
    await queryRunner.query(
      `CREATE TABLE "121-service"."organization" (
        "id" SERIAL NOT NULL,
        "created" TIMESTAMP NOT NULL DEFAULT now(),
        "updated" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "displayName" json NOT NULL,
        CONSTRAINT "PK_organization" PRIMARY KEY ("id")
      )`,
    );
  }
}
