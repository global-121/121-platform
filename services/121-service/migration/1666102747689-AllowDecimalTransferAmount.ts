import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowDecimalTransferAmount1666102747689
  implements MigrationInterface {
  name = 'AllowDecimalTransferAmount1666102747689';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "amount" real NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "fixedTransferValue"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "fixedTransferValue" real`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" DROP COLUMN "amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" ADD "amount" real`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" DROP COLUMN "amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" ADD "amount" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "fixedTransferValue"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "fixedTransferValue" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "amount" integer NOT NULL`,
    );
  }
}
