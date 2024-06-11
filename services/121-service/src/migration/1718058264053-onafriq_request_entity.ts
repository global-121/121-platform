import { MigrationInterface, QueryRunner } from 'typeorm';

export class OnafriqRequestEntity1718058264053 implements MigrationInterface {
  name = 'OnafriqRequestEntity1718058264053';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."onafriq_request" ("id" SERIAL NOT NULL, "initiatorName" character varying NOT NULL, "securityCredential" character varying NOT NULL, "commandID" character varying NOT NULL, "amount" integer NOT NULL, "partyA" character varying NOT NULL, "partyB" character varying NOT NULL, "remarks" character varying NOT NULL, "queueTimeOutURL" character varying NOT NULL, "resultURL" character varying NOT NULL, "occassion" character varying NOT NULL, "status" character varying NOT NULL, "originatorConversationID" character varying NOT NULL, "conversationID" character varying NOT NULL, "requestResult" json NOT NULL DEFAULT '{}', "paymentResult" json NOT NULL DEFAULT '{}', "transactionId" integer, CONSTRAINT "REL_8bb2f87752341dcd2592c14528" UNIQUE ("transactionId"), CONSTRAINT "PK_0bbd6e6c239139f46241269f158" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."onafriq_request" ADD CONSTRAINT "FK_8bb2f87752341dcd2592c145285" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."onafriq_request" DROP CONSTRAINT "FK_8bb2f87752341dcd2592c145285"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."onafriq_request"`);
  }
}
