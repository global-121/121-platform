import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowDecimalTransferAmount1666102747689
  implements MigrationInterface {
  name = 'AllowDecimalTransferAmount1666102747689';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" RENAME COLUMN "amount" TO "amount_TEMP"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "amount" real`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."transaction" SET "amount" = cast("amount_TEMP" as real)`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "amount_TEMP"`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."program" RENAME COLUMN "fixedTransferValue" TO "fixedTransferValue_TEMP"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "fixedTransferValue" real`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."program" SET "fixedTransferValue" = cast("fixedTransferValue_TEMP" as real)`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "fixedTransferValue_TEMP"`,
    );

    queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" RENAME COLUMN "amount" TO "amount_TEMP"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" ADD "amount" real`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."intersolve_barcode" SET "amount" = cast("amount_TEMP" as real)`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" DROP COLUMN "amount_TEMP"`,
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
