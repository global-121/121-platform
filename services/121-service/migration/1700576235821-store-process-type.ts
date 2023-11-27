import { MigrationInterface, QueryRunner } from 'typeorm';

export class StoreProcessType1700576235821 implements MigrationInterface {
  name = 'StoreProcessType1700576235821';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD "processType" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP COLUMN "processType"`,
    );
  }
}
