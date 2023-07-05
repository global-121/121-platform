import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentAmountMultiplier1688559121794
  implements MigrationInterface
{
  name = 'PaymentAmountMultiplier1688559121794';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "121-service"."registration" SET "paymentAmountMultiplier" = 1 WHERE "paymentAmountMultiplier" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ALTER COLUMN "paymentAmountMultiplier" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ALTER COLUMN "paymentAmountMultiplier" SET DEFAULT '1'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ALTER COLUMN "paymentAmountMultiplier" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ALTER COLUMN "paymentAmountMultiplier" DROP NOT NULL`,
    );
  }
}
