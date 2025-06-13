import { MigrationInterface, QueryRunner } from 'typeorm';

export class Test21749814491739 implements MigrationInterface {
  name = 'Test21749814491739';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "121-service"."program_fsp_configuration_property_id_seq" OWNED BY "121-service"."program_fsp_configuration_property"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."program_fsp_configuration_property_id_seq"')`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_fff8ff586a03d469256098b8f86"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_c5eb02b5f6a4b4269d0a19b49f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" DROP CONSTRAINT "FK_23260bdde9cee10304192140b77"`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "121-service"."program_fsp_configuration_id_seq" OWNED BY "121-service"."program_fsp_configuration"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."program_fsp_configuration_id_seq"')`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" ADD CONSTRAINT "FK_23260bdde9cee10304192140b77" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_c5eb02b5f6a4b4269d0a19b49f2" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_fff8ff586a03d469256098b8f86" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_fff8ff586a03d469256098b8f86"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_c5eb02b5f6a4b4269d0a19b49f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" DROP CONSTRAINT "FK_23260bdde9cee10304192140b77"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `DROP SEQUENCE "121-service"."program_fsp_configuration_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" ADD CONSTRAINT "FK_23260bdde9cee10304192140b77" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_c5eb02b5f6a4b4269d0a19b49f2" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_fff8ff586a03d469256098b8f86" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `DROP SEQUENCE "121-service"."program_fsp_configuration_property_id_seq"`,
    );
  }
}
