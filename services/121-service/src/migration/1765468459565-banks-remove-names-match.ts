import { MigrationInterface, QueryRunner } from 'typeorm';

export class BanksRemoveNamesMatch1765468459565 implements MigrationInterface {
  name = 'BanksRemoveNamesMatch1765468459565';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial_bank_ethiopia_account_enquiries" DROP COLUMN "namesMatch"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."cooperative_bank_of_oromia_account_validation" DROP COLUMN "namesMatch"`,
    );
  }

  public async down(_: QueryRunner): Promise<void> {
    console.log('We never go down, no way back.');
  }
}
