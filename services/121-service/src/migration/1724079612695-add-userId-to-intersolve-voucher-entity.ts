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
      SET "userId" = subquery."userId"
      FROM (
          SELECT t."payment", t."userId"
          FROM "121-service"."transaction" t
          JOIN (
              SELECT "payment", MAX("created") AS latest
              FROM "121-service"."transaction"
              GROUP BY "payment"
          ) AS latest_t
          ON t."payment" = latest_t."payment" AND t."created" = latest_t.latest
      ) AS subquery
      WHERE iv."payment" = subquery."payment";
    `);

    await queryRunner.query(
      `UPDATE "121-service"."intersolve_voucher"
       SET "userId" = (
         SELECT id FROM "121-service"."user" WHERE "username" LIKE 'admin@%' LIMIT 1
       )
       WHERE "userId" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" ALTER COLUMN "userId" SET NOT NULL`,
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
      `ALTER TABLE "121-service"."intersolve_voucher" ALTER COLUMN "userId" DROP NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" ADD CONSTRAINT "FK_7eff6d2d8b784b4ff880d925adc" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
