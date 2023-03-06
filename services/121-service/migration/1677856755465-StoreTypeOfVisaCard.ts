import { MigrationInterface, QueryRunner } from 'typeorm';

export class StoreTypeOfVisaCard1677856755465 implements MigrationInterface {
  name = 'StoreTypeOfVisaCard1677856755465';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_card" ADD "type" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_card" DROP COLUMN "type"`,
    );
  }
}
