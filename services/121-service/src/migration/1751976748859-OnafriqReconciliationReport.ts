import { MigrationInterface, QueryRunner } from 'typeorm';

export class OnafriqReconciliationReport1751976748859 implements MigrationInterface {
  name = 'OnafriqReconciliationReport1751976748859';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."onafriq_transaction" ADD "mfsTransId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."onafriq_transaction" ADD "recipientMsisdn" character varying NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."onafriq_transaction" DROP COLUMN "mfsTransId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."onafriq_transaction" DROP COLUMN "recipientMsisdn"`,
    );
  }
}
