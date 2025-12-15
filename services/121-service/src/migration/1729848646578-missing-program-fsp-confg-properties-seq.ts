import { MigrationInterface, QueryRunner } from 'typeorm';

export class MissingProgramFspConfgPropertiesSeq1729848646578 implements MigrationInterface {
  name = 'MissingProgramFspConfgPropertiesSeq1729848646578';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // These queries are also present in src/migration/1729605362361-program-registration-attribute-refactor.ts for some reason however typeorm still generates
    // this migration file. Could not find a way around this. So leaving it as is.
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "121-service"."program_financial_service_pro_id_seq" OWNED BY "121-service"."program_financial_service_provider_configuration_property"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration_property" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."program_financial_service_pro_id_seq"')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration_property" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `DROP SEQUENCE "121-service"."program_financial_service_pro_id_seq"`,
    );
  }
}
