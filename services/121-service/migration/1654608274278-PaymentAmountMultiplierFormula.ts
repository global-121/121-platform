import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentAmountMultiplierFormula1654608274278
  implements MigrationInterface {
  name = 'PaymentAmountMultiplierFormula1654608274278';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "paymentAmountMultiplierFormula" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "paymentAmountMultiplierFormula"`,
    );
  }
}
