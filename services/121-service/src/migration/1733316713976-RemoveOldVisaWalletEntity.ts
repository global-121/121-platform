import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveOldVisaWalletEntity1733316713976 implements MigrationInterface {
  name = 'RemoveOldVisaWalletEntity1733316713976';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the intersolve_visa_wallet table
    await queryRunner.query(
      `DROP TABLE IF EXISTS "121-service"."intersolve_visa_wallet"`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Down migration is not needed
  }
}
