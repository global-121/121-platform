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
    const manager = queryRunner.manager;
    const financialServiceProviderRepo = manager.getRepository(
      FinancialServiceProviderEntity,
    );

    const existingData = await queryRunner.query(
      `SELECT * FROM "121-service"."financial_service_provider" ORDER BY "id" ASC`,
    );

    const financialServiceProviders = existingData.map(
      (financialServiceProvider: any) => {
        if (
          financialServiceProvider?.fspDisplayNamePortal &&
          typeof financialServiceProvider?.fspDisplayNamePortal === 'string'
        ) {
          try {
            financialServiceProvider.displayName = JSON.parse(
              financialServiceProvider?.fspDisplayNamePortal,
            );
          } catch (error) {
            financialServiceProvider.displayName = {
              en: financialServiceProvider?.fspDisplayNamePortal,
            };
          }
        }

        return financialServiceProvider;
      },
    );

    await financialServiceProviderRepo.save(financialServiceProviders, {
      chunk: 300,
    });
  }
}
