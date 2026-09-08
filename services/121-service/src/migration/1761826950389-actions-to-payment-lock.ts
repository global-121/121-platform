import { MigrationInterface, QueryRunner } from 'typeorm';

export class ActionsToPaymentLock1761826950389 implements Omit<
  MigrationInterface,
  'down'
> {
  name = 'ActionsToPaymentLock1761826950389';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "paymentsAreLocked" boolean NOT NULL DEFAULT false`,
    );
    // drop actions table
    await queryRunner.query(`DROP TABLE "121-service"."action"`);
  }
}
