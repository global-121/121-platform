import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomAttributes1643716964752 implements MigrationInterface {
  name = 'AddCustomAttributes1643716964752';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_custom_attribute" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "label" json NOT NULL, "type" character varying NOT NULL, "programId" integer, CONSTRAINT "PK_8c206a81cfc68bd8e7407518974" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bc3009d3446dc3de08c4e99612" ON "121-service"."program_custom_attribute" ("created") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_40dd226b99324147dd82c9d50a" ON "121-service"."program_custom_attribute" ("name") `,
    );
    // Explicitly needed here, because otherwise the subsequent migration file tries to insert in a non-existing table
    await queryRunner.commitTransaction();
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_40dd226b99324147dd82c9d50a"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_bc3009d3446dc3de08c4e99612"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."program_custom_attribute"`,
    );
  }
}
