import { MigrationInterface, QueryRunner } from "typeorm";

export class LatestTransaction1695742378425 implements MigrationInterface {
    name = 'LatestTransaction1695742378425'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "121-service"."latest_transaction" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "payment" integer NOT NULL DEFAULT '1', "registrationId" integer, "transactionId" integer, CONSTRAINT "REL_10994d027e2fbaf4ff8e8bf5f4" UNIQUE ("transactionId"), CONSTRAINT "PK_dbfdd1bd40e8b22422efaf592ad" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_18f7adecdbe9b35cf252baf8b7" ON "121-service"."latest_transaction" ("created") `);
    await queryRunner.query(`CREATE INDEX "IDX_439c3da422d6de1916e4e4e815" ON "121-service"."latest_transaction" ("payment") `);
    await queryRunner.query(`CREATE INDEX "IDX_a218fd8d386666984192f30636" ON "121-service"."latest_transaction" ("registrationId") `);
    await queryRunner.query(`CREATE INDEX "IDX_10994d027e2fbaf4ff8e8bf5f4" ON "121-service"."latest_transaction" ("transactionId") `);
    await queryRunner.query(`ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "FK_a218fd8d386666984192f306367" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "FK_10994d027e2fbaf4ff8e8bf5f45" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);


    await queryRunner.query(`
      INSERT INTO "121-service"."latest_transaction" ("payment", "registrationId", "transactionId")
      SELECT t.payment, t."registrationId", t.id AS transactionId
      FROM (
          SELECT payment, "registrationId", MAX(created) AS max_created
          FROM "121-service"."transaction"
          WHERE status = 'success'
          GROUP BY payment, "registrationId"
      ) AS latest_transactions
      INNER JOIN "121-service"."transaction" AS t
          ON t.payment = latest_transactions.payment
          AND t."registrationId" = latest_transactions."registrationId"
          AND t.created = latest_transactions.max_created;`
      )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT "FK_10994d027e2fbaf4ff8e8bf5f45"`);
        await queryRunner.query(`ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT "FK_a218fd8d386666984192f306367"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_10994d027e2fbaf4ff8e8bf5f4"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_a218fd8d386666984192f30636"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_439c3da422d6de1916e4e4e815"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_18f7adecdbe9b35cf252baf8b7"`);
        await queryRunner.query(`DROP TABLE "121-service"."latest_transaction"`);
    }

}
