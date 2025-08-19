import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentEntity1754399322187 implements MigrationInterface {
  name = 'PaymentEntity1754399322187';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create new payment entity
    await queryRunner.query(
      `CREATE TABLE "121-service"."payment" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programId" integer NOT NULL, CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c41c74d4a96568569c71cffe88" ON "121-service"."payment" ("created") `,
    );

    // Add paymentId column to transaction entity (initially nullable)
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "paymentId" integer`,
    );

    // Fill transaction.paymentId with the correct values

    const allProgramIds = await queryRunner.query(`
      SELECT DISTINCT "id" FROM "121-service"."program"
    `);

    for (const program of allProgramIds) {
      const programId = program.id;
      const uniquePayments = await queryRunner.query(
        `
        SELECT
          MIN(t."created") as "created",
          t."payment" as "payment",
          MAX(t."updated") as "updated"
        FROM "121-service"."transaction" t
        WHERE t."programId" = $1 AND t."payment" IS NOT NULL
        GROUP BY t."payment"
        ORDER BY t.payment
      `,
        [programId],
      );

      for (const uniquePayment of uniquePayments) {
        // insert into payment table
        await queryRunner.query(
          `
        INSERT INTO "121-service"."payment" (
          "created",
          "updated",
          "programId"
        )
        VALUES ($1, $2, $3)
        `,
          [uniquePayment.created, uniquePayment.updated, programId],
        );
        // get the last inserted payment id
        const paymentId = await queryRunner.query(
          `
          SELECT LASTVAL()
          `,
        );
        // update transaction.paymentId with the last inserted payment id
        await queryRunner.query(
          `
          UPDATE "121-service"."transaction"
          SET "paymentId" = $1
          WHERE "programId" = $2 AND "payment" = $3
          `,
          [paymentId[0].lastval, programId, uniquePayment.payment],
        );
      }
    }

    // Set  paymentId to NOT NULL
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ALTER COLUMN "paymentId" SET NOT NULL`,
    );
    // Other datamodel migrations
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_d3c35664dbb056d04694819316e"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_d3c35664dbb056d04694819316"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ALTER COLUMN "programId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_26ba3b75368b99964d6dea5cc2" ON "121-service"."transaction" ("paymentId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_d3c35664dbb056d04694819316e" FOREIGN KEY ("programId") REFERENCES "121-service"."payment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "programId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment" ADD CONSTRAINT "FK_0f8f281d1010c17f17ff240328a" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" RENAME COLUMN "payment" TO "paymentId"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_439c3da422d6de1916e4e4e815"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_ea52d8a2faad81796097568a41"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" RENAME COLUMN "payment" TO "paymentId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ALTER COLUMN "paymentId" DROP DEFAULT`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_af58c0aee423580ac447ab5eff" ON "121-service"."latest_transaction" ("paymentId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "FK_af58c0aee423580ac447ab5eff3" FOREIGN KEY ("paymentId") REFERENCES "121-service"."payment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_26ba3b75368b99964d6dea5cc2c" FOREIGN KEY ("paymentId") REFERENCES "121-service"."payment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT IF EXISTS "registrationPaymentLatestTransactionUnique"`,
    );

    // Update paymentId in latest_transaction
    await queryRunner.query(`
      UPDATE "121-service"."latest_transaction"
      SET "paymentId" = t."paymentId"
      FROM "121-service"."transaction" t
      WHERE "latest_transaction"."transactionId" = t."id"
    `);

    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "registrationPaymentLatestTransactionUnique" UNIQUE ("paymentId", "registrationId")`,
    );

    // Update paymentId in intersolve_voucher
    await queryRunner.query(`
      UPDATE "121-service"."intersolve_voucher"
      SET "paymentId" = j."paymentId"
      FROM (
      	select i2."voucherId"
      		,t."paymentId"
      	from "121-service".intersolve_voucher i
      	left join "121-service".imagecode_export_vouchers i2 on i.id = i2."voucherId"
      	left join "121-service".transaction t on i2."registrationId" = t."registrationId" and i."paymentId" = t.payment
      ) j
      where "intersolve_voucher".id = j."voucherId"
    `);

    // Drop transaction.payment column (done last, as it is used in data migrations above)
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "payment"`,
    );
  }

  public async down(_: QueryRunner): Promise<void> {
    console.log('We only move forward, never look back');
  }
}
