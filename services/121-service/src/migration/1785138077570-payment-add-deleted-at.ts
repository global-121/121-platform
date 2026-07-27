import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentAddDeletedAt1785138077570 implements MigrationInterface {
  name = 'PaymentAddDeletedAt1785138077570';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment" ADD "deletedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment" DROP COLUMN "deletedAt"`,
    );
  }
}
