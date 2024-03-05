import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTableFspAttributeToFinancialServiceProviderQuestion1709612326501
  implements MigrationInterface
{
  name =
    'RenameTableFspAttributeToFinancialServiceProviderQuestion1709612326501';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Delete registration_view, will be created again at the end
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);

    // Drop constraings
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "FK_58b2a3b937d3b3dbf30c4d328b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" DROP CONSTRAINT "FK_16ab80e3d29fab4db86caa37b3b"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_a81f3c2a35d30ecae0bb51dea0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" DROP CONSTRAINT "CHK_4a352f0c222361d0219e19888a"`,
    );

    // Alter table name
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" RENAME TO "financial_service_provider_question"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "FK_58b2a3b937d3b3dbf30c4d328b2"`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "121-service"."financial_service_provider_question_id_seq" OWNED BY "121-service"."financial_service_provider_question"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."financial_service_provider_question_id_seq"')`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" ADD CONSTRAINT "CHK_00f87680a13a8334037888a940" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'importedDate', 'invitedDate', 'startedRegistrationDate', 'registeredWhileNoLongerEligibleDate', 'registeredDate', 'rejectionDate', 'noLongerEligibleDate', 'validationDate', 'inclusionDate', 'inclusionEndDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType', 'declinedDate'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "FK_58b2a3b937d3b3dbf30c4d328b2" FOREIGN KEY ("fspQuestionId") REFERENCES "121-service"."financial_service_provider_question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Create index
    await queryRunner.query(
      `CREATE INDEX "IDX_bcd81a9cce2d5da7c36ad46402" ON "121-service"."financial_service_provider_question" ("created") `,
    );

    // Create constraints
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "FK_58b2a3b937d3b3dbf30c4d328b2" FOREIGN KEY ("fspQuestionId") REFERENCES "121-service"."financial_service_provider_question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" ADD CONSTRAINT "FK_3bd28271af5a2ad5cc552384f18" FOREIGN KEY ("fspId") REFERENCES "121-service"."fsp"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Update registration_view
    await queryRunner.query(
      `CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fsp"."fsp" AS "financialServiceProvider", "fsp"."fspDisplayNamePortal" AS "fspDisplayNamePortal", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",'yyyy-mm-dd') AS "registrationCreatedDate", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."fsp" "fsp" ON "fsp"."id"="registration"."fspId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_view',
        'SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fsp"."fsp" AS "financialServiceProvider", "fsp"."fspDisplayNamePortal" AS "fspDisplayNamePortal", CAST(CONCAT(\'PA #\',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",\'yyyy-mm-dd\') AS "registrationCreatedDate", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || \': \' || "message"."status",\'no messages yet\') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."fsp" "fsp" ON "fsp"."id"="registration"."fspId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
