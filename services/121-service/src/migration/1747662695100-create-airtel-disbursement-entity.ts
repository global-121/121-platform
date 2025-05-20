import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAirtelDisbursementEntity1747662695100
  implements MigrationInterface
{
  name = 'CreateAirtelDisbursementEntity1747662695100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."airtel_disbursement" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "airtelTransactionId" character varying NOT NULL, "airtelStatusResponseCode" character varying, "isResponseReceived" boolean, "transactionId" integer NOT NULL, CONSTRAINT "UQ_3a18884857eb5ea39adccbbe345" UNIQUE ("airtelTransactionId"), CONSTRAINT "REL_8c33098fbfee3713fb664eb18e" UNIQUE ("transactionId"), CONSTRAINT "PK_55d419e07a264a7d37775ff9ec1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_599583aed5cd9a203809e05db0" ON "121-service"."airtel_disbursement" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."airtel_disbursement" ADD CONSTRAINT "FK_8c33098fbfee3713fb664eb18ee" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."airtel_disbursement" DROP CONSTRAINT "FK_8c33098fbfee3713fb664eb18ee"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_599583aed5cd9a203809e05db0"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."airtel_disbursement"`);
  }
}
