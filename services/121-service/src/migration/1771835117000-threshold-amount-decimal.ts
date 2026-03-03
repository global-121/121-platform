import { MigrationInterface, QueryRunner } from 'typeorm';

export class ThresholdAmountDecimal1771835117000 implements MigrationInterface {
  name = 'ThresholdAmountDecimal1771835117000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change thresholdAmount from integer to decimal(10,2)
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_approval_threshold"
       ALTER COLUMN "thresholdAmount" TYPE decimal(10,2)`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no no we never go dooown
  }
}
