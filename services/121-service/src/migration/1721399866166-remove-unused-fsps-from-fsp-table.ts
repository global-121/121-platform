import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUnusedFspsFromFspTable1721399866166
  implements MigrationInterface
{
  name = 'RemoveUnusedFspsFromFspTable1721399866166';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();
    try {
      // Delete related records from dependent tables
      await queryRunner.query(`
        DELETE FROM "121-service"."transaction"
        WHERE "financialServiceProviderId" IN (
          SELECT id FROM "121-service"."financial_service_provider"
          WHERE fsp IN (
            'Africas-talking',
            'BoB-finance',
            'BelCash',
            'UkrPoshta'
          )
        );
      `);

      await queryRunner.query(`
        DELETE FROM "121-service"."program_fsp_configuration"
        WHERE "fspId" IN (
          SELECT id FROM "121-service"."financial_service_provider"
          WHERE fsp IN (
            'Africas-talking',
            'BoB-finance',
            'BelCash',
            'UkrPoshta'
          )
        );
      `);

      await queryRunner.query(`
        DELETE FROM "121-service"."financial_service_provider_question"
        WHERE "fspId" IN (
          SELECT id FROM "121-service"."financial_service_provider"
          WHERE fsp IN (
            'Africas-talking',
            'BoB-finance',
            'BelCash',
            'UkrPoshta'
          )
        );
      `);

      await queryRunner.query(`
        DELETE FROM "121-service"."program_financial_service_providers_financial_service_provider"
        WHERE "financialServiceProviderId" IN (
          SELECT id FROM "121-service"."financial_service_provider"
          WHERE fsp IN (
            'Africas-talking',
            'BoB-finance',
            'BelCash',
            'UkrPoshta'
          )
        );
      `);

      await queryRunner.query(`
        DELETE FROM "121-service".financial_service_provider
        WHERE fsp IN (
          'Africas-talking',
          'BoB-finance',
          'BelCash',
          'UkrPoshta'
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
