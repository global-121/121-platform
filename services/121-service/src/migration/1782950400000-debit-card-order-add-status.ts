import { MigrationInterface, QueryRunner } from 'typeorm';

export class DebitCardOrderAddStatus1782950400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "121-service"."intersolve_visa_card_order"
      ADD "status" character varying
    `);

    await queryRunner.query(`
      UPDATE "121-service"."intersolve_visa_card_order"
      SET "status" = 'completed'
    `);

    await queryRunner.query(`
      ALTER TABLE "121-service"."intersolve_visa_card_order"
      ALTER COLUMN "status" SET NOT NULL
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Intentionally left empty — we never run down migrations.
  }
}
