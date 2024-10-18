import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveVodacashFromFspTable1729241929168
  implements MigrationInterface
{
  name = 'RemoveVodacashFromFspTable1729241929168';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();
    try {
      // Delete related records from dependent tables
      await queryRunner.query(`
        DELETE FROM "121-service"."transaction"
        WHERE "financialServiceProviderId" IN (
          SELECT id FROM "121-service"."financial_service_provider"
          WHERE fsp IN (
            'Vodacash'
          )
        );
      `);

      await queryRunner.query(`
        DELETE FROM "121-service"."program_fsp_configuration"
        WHERE "fspId" IN (
          SELECT id FROM "121-service"."financial_service_provider"
          WHERE fsp IN (
            'Vodacash'
          )
        );
      `);

      await queryRunner.query(`
        DELETE FROM "121-service"."financial_service_provider_question"
        WHERE "fspId" IN (
          SELECT id FROM "121-service"."financial_service_provider"
          WHERE fsp IN (
            'Vodacash'
          )
        );
      `);

      await queryRunner.query(`
        DELETE FROM "121-service"."program_financial_service_providers_financial_service_provider"
        WHERE "financialServiceProviderId" IN (
          SELECT id FROM "121-service"."financial_service_provider"
          WHERE fsp IN (
            'Vodacash'
          )
        );
      `);

      await queryRunner.query(`
        DELETE FROM "121-service".financial_service_provider
        WHERE fsp IN (
            'Vodacash'
        );
      `);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
