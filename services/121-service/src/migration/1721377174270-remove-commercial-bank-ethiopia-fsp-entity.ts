import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCommercialBankEthiopiaFspEntity1721377174270
  implements MigrationInterface
{
  name = 'RemoveCommercialBankEthiopiaFspEntity1721377174270';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the table if it exists
    await queryRunner.query(
      `DROP TABLE IF EXISTS "121-service"."commercial_bank_ethiopia_account_enquiries"`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
