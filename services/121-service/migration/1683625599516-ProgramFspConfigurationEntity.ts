import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProgramFspConfigurationEntity1683625599516
  implements MigrationInterface
{
  name = 'ProgramFspConfigurationEntity1683625599516';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_fsp_configuration" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programId" integer NOT NULL, "fspId" integer NOT NULL, "name" character varying NOT NULL, "value" character varying NOT NULL, CONSTRAINT "programFspConfigurationUnique" UNIQUE ("programId", "fspId", "name"), CONSTRAINT "PK_8c7b8aee32b9d0b173d656f7ac3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9c1fabe6ed57e114b586d3445" ON "121-service"."program_fsp_configuration" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ADD CONSTRAINT "FK_6be88e8576970978a911084534e" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ADD CONSTRAINT "FK_16ea24d04150003a29a346ade61" FOREIGN KEY ("fspId") REFERENCES "121-service"."fsp"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" DROP CONSTRAINT "FK_16ea24d04150003a29a346ade61"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" DROP CONSTRAINT "FK_6be88e8576970978a911084534e"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_e9c1fabe6ed57e114b586d3445"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."program_fsp_configuration"`,
    );
  }
}
