import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToIntersolveVoucherEntity1724079612695
  implements MigrationInterface
{
  name = 'AddUserIdToIntersolveVoucherEntity1724079612695';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" ADD "userId" integer`,
    );

    await queryRunner.query(`
      UPDATE "121-service"."intersolve_voucher" iv
      SET "userId" = t."userId"
      FROM "121-service"."transaction" t
      WHERE iv."payment" = t."payment"
    `);

    await queryRunner.query(
      `UPDATE "121-service"."intersolve_voucher" SET "userId" = 1 WHERE "userId" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" ADD CONSTRAINT "FK_7eff6d2d8b784b4ff880d925adc" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" DROP CONSTRAINT "FK_7eff6d2d8b784b4ff880d925adc"`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" DROP COLUMN "userId"`,
    );
  }
}
