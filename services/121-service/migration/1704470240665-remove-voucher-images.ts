import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveVoucherImages1704470240665 implements MigrationInterface {
  name = 'RemoveVoucherImages1704470240665';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" DROP COLUMN "image"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" ADD "image" bytea NOT NULL`,
    );
  }
}
