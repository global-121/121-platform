import { MigrationInterface, QueryRunner } from 'typeorm';

export class TokenCodeUnique1676905046048 implements MigrationInterface {
  name = 'TokenCodeUnique1676905046048';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_card" ADD CONSTRAINT "UQ_5859fe005b0a7fb606f6f191c50" UNIQUE ("tokenCode")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_card" DROP CONSTRAINT "UQ_5859fe005b0a7fb606f6f191c50"`,
    );
  }
}
