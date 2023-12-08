import { MigrationInterface, QueryRunner } from 'typeorm';

export class safaricomRequestEntity1688981408606 implements MigrationInterface {
  name = 'safaricomRequestEntity1688981408606';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."safaricom_request" ("id" SERIAL NOT NULL, "initiatorName" character varying NOT NULL, "securityCredential" character varying NOT NULL, "commandID" character varying NOT NULL, "amount" integer NOT NULL, "partyA" character varying NOT NULL, "partyB" character varying NOT NULL, "remarks" character varying NOT NULL, "queueTimeOutURL" character varying NOT NULL, "resultURL" character varying NOT NULL, "occassion" character varying NOT NULL, "status" character varying NOT NULL, "originatorConversationID" character varying NOT NULL, "conversationID" character varying NOT NULL, "requestResult" json NOT NULL DEFAULT '{}', "paymentResult" json NOT NULL DEFAULT '{}', "transactionId" integer, CONSTRAINT "REL_76a85e893850c2ef7ce4b6441a" UNIQUE ("transactionId"), CONSTRAINT "PK_87b4ae825294dc90f1f1fca784d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" ADD CONSTRAINT "FK_76a85e893850c2ef7ce4b6441a0" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" DROP CONSTRAINT "FK_76a85e893850c2ef7ce4b6441a0"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."safaricom_request"`);
  }
}
