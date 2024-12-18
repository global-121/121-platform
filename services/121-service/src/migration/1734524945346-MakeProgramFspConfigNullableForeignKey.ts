import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeProgramFspConfigNullableForeignKey1734524945346
  implements MigrationInterface
{
  name = 'MakeProgramFspConfigNullableForeignKey1734524945346';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_d8a56a1864ef40e1551833430bb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_148b6bb5c37ca2d444b01c00c2f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ALTER COLUMN "programFinancialServiceProviderConfigurationId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ALTER COLUMN "programFinancialServiceProviderConfigurationId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_d8a56a1864ef40e1551833430bb" FOREIGN KEY ("programFinancialServiceProviderConfigurationId") REFERENCES "121-service"."program_financial_service_provider_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_148b6bb5c37ca2d444b01c00c2f" FOREIGN KEY ("programFinancialServiceProviderConfigurationId") REFERENCES "121-service"."program_financial_service_provider_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_148b6bb5c37ca2d444b01c00c2f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_d8a56a1864ef40e1551833430bb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ALTER COLUMN "programFinancialServiceProviderConfigurationId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ALTER COLUMN "programFinancialServiceProviderConfigurationId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_148b6bb5c37ca2d444b01c00c2f" FOREIGN KEY ("programFinancialServiceProviderConfigurationId") REFERENCES "121-service"."program_financial_service_provider_configuration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_d8a56a1864ef40e1551833430bb" FOREIGN KEY ("programFinancialServiceProviderConfigurationId") REFERENCES "121-service"."program_financial_service_provider_configuration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
