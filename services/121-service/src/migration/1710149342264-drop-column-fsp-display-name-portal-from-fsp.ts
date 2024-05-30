import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropColumnFspDisplayNamePortalFromFsp1710149342264
  implements MigrationInterface
{
  name = 'DropColumnFspDisplayNamePortalFromFsp1710149342264';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop registration_view
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);

    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider" DROP COLUMN "fspDisplayNamePaApp"`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider" DROP COLUMN "fspDisplayNamePortal"`,
    );

    // Re-create registration_view
    await queryRunner.query(
      `CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated",
      "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId",
      "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore",
      "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount",
      "registration"."scope" AS "scope", "fsp"."fsp" AS "financialServiceProvider", "fsp"."displayName" AS "fspDisplayName",
      CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId",
      TO_CHAR("registration"."created",'yyyy-mm-dd') AS "registrationCreatedDate", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining",
      COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus" FROM "121-service"."registration" "registration"
      LEFT JOIN "121-service"."financial_service_provider" "fsp" ON "fsp"."id"="registration"."fspId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"
      LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Down migration not implemented
  }
}
