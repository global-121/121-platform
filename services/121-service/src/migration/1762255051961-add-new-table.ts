import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewTable1762255051961 implements MigrationInterface {
  name = 'AddNewTable1762255051961';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."aaafoobartest" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programId" integer NOT NULL)`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // only up
  }
}
