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

    // Fill payment entity
    await queryRunner.query(`
      INSERT INTO "121-service"."payment" (
        "created",
        "updated",
        "programId"
      )
      SELECT
        MIN(t."created") as "created",
        MAX(t."updated") as "updated",
        t."programId"
      FROM "121-service"."transaction" t
      WHERE t."payment" IS NOT NULL
      GROUP BY t."payment", t."programId"
      ORDER BY t."programId" , MIN(t."created")
    `);

    // Add paymentId column to transaction entity (initially nullable)
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "paymentId" integer`,
    );

    // Fill transaction.paymentId with the correct values
    await queryRunner.query(`
      UPDATE "121-service"."transaction"
      SET "paymentId" = (
        SELECT pp.new_payment_id
        FROM (
        select p.id as new_payment_id
        ,t_agg.payment
        ,t_agg."programId"
      FROM "121-service"."payment" p
      INNER JOIN (
        SELECT
              MIN(t."created") as "created",
              t."programId",
              t.payment
            FROM "121-service"."transaction" t
            WHERE t."payment" IS NOT NULL
            GROUP BY t."payment", t."programId"
            ORDER BY t."programId" , MIN(t."created")
      ) t_agg
        on p."programId"=t_agg."programId" and p.created = t_agg.created
        ) pp
        WHERE pp."programId" = "transaction"."programId"
          AND pp."payment" = "transaction"."payment"
        )
    `);

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

    // Update paymentId in latest_transaction
    await queryRunner.query(`
      UPDATE "121-service"."latest_transaction"
      SET "paymentId" = t."paymentId"
      FROM "121-service"."transaction" t
      WHERE "latest_transaction"."transactionId" = t."id"
    `);

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

  public async down(queryRunner: QueryRunner): Promise<void> {
    // NOTE: this only reverts datamodel migrations, not data migrations
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment" DROP CONSTRAINT "FK_0f8f281d1010c17f17ff240328a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_d3c35664dbb056d04694819316e"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_26ba3b75368b99964d6dea5cc2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ALTER COLUMN "programId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "paymentId"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_c41c74d4a96568569c71cffe88"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."payment"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_d3c35664dbb056d04694819316" ON "121-service"."transaction" ("programId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_d3c35664dbb056d04694819316e" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
