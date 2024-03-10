import { MigrationInterface, QueryRunner } from 'typeorm';
import { FinancialServiceProviderEntity } from '../src/fsp/financial-service-provider.entity';

export class MigrateFspDisplayNamePortalDataToDisplayName1710080807910
  implements MigrationInterface
{
  name = 'MigrateFspDisplayNamePortalDataToDisplayName1710080807910';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    // migrate existing data from fspDisplayNamePaApp / fspDisplayNamePortal to displayName
    await this.migrateFspDisplayName(queryRunner);
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "121-service"."financial_service_provider" SET "displayName" = NULL`,
    );
  }

  private async migrateFspDisplayName(queryRunner: QueryRunner): Promise<void> {
    console.time('migrateFspDisplayName');
    const manager = queryRunner.manager;
    const eventRepo = manager.getRepository(FinancialServiceProviderEntity);

    const existingData = await queryRunner.query(
      `SELECT * FROM "121-service"."financial_service_provider" ORDER BY "id" ASC`,
    );

    const financialServiceProviders = existingData.map(
      (financialServiceProvider: FinancialServiceProviderEntity) => {
        financialServiceProvider.displayName =
          financialServiceProvider.fspDisplayNamePaApp;
        return financialServiceProvider;
      },
    );

    await eventRepo.save(financialServiceProviders, { chunk: 300 });
    console.timeEnd('migrateFspDisplayName');
  }
}
