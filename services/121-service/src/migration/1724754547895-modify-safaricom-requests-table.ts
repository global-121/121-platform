import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModifySafaricomRequestsTable1724754547895
  implements MigrationInterface
{
  name = 'ModifySafaricomRequestsTable1724754547895';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Drop the columns that are not needed
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" DROP COLUMN "initiatorName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" DROP COLUMN "securityCredential"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" DROP COLUMN "commandID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" DROP COLUMN "amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" DROP COLUMN "partyA"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" DROP COLUMN "partyB"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" DROP COLUMN "remarks"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" DROP COLUMN "queueTimeOutURL"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" DROP COLUMN "resultURL"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" DROP COLUMN "occassion"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" DROP COLUMN "requestResult"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" DROP COLUMN "paymentResult"`,
    );

    // Step 2: Add the necessary columns
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" ADD COLUMN IF NOT EXISTS "mpesaTransactionId" character varying`,
    );

    // Step 3: Rename the necessary columns
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" RENAME COLUMN "conversationID" TO "mpesaConversationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" RENAME COLUMN "originatorConversationID" TO "originatorConversationId"`,
    );

    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."safaricom_request" DROP CONSTRAINT "FK_76a85e893850c2ef7ce4b6441a0"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."safaricom_request" ADD CONSTRAINT "FK_1f9a3e9003d584d12009b19b568" FOREIGN KEY ("mpesaTransactionId") REFERENCES "121-service"."transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    // );

    await queryRunner.query(
      `ALTER SEQUENCE IF EXISTS "121-service".safaricom_request_id_seq RENAME TO safaricom_transfer_id_seq;`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."safaricom_transfer_id_seq"')`,
    );

    // Step 4: Rename the table
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_request" RENAME TO "safaricom_transfer"`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
