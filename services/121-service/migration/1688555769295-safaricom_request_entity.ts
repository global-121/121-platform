import { MigrationInterface, QueryRunner } from 'typeorm';

export class safaricomRequestEntity1688555769295 implements MigrationInterface {
  name = 'safaricomRequestEntity1688555769295';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."safaricom_request" ("id" SERIAL NOT NULL, "initiatorName" character varying NOT NULL, "securityCredential" character varying NOT NULL, "commandID" character varying NOT NULL, "amount" integer NOT NULL, "partyA" character varying NOT NULL, "partyB" character varying NOT NULL, "remarks" character varying NOT NULL, "queueTimeOutURL" character varying NOT NULL, "resultURL" character varying NOT NULL, "occassion" character varying NOT NULL, "status" character varying NOT NULL, "requestResult" json NOT NULL DEFAULT '{}', "paymentResult" json NOT NULL DEFAULT '{}', CONSTRAINT "PK_87b4ae825294dc90f1f1fca784d" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "121-service"."safaricom_request"`);
  }
}
