import { MigrationInterface, QueryRunner } from 'typeorm';

export class Nedbank1736155425026 implements MigrationInterface {
  name = 'Nedbank1736155425026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."nedbank_voucher" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "orderCreateReference" character varying NOT NULL,  "paymentReference" character varying NOT NULL, "status" character varying, "transactionId" integer NOT NULL, CONSTRAINT "UQ_3a31e9cd76bd9c06826c016c130" UNIQUE ("orderCreateReference"), CONSTRAINT "REL_739b726eaa8f29ede851906edd" UNIQUE ("transactionId"), CONSTRAINT "PK_85d56d9ed997ba24b53b3aa36e7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0db7adee73f8cc5c9d44a77e7b" ON "121-service"."nedbank_voucher" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."nedbank_voucher" ADD CONSTRAINT "FK_739b726eaa8f29ede851906edd3" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3a31e9cd76bd9c06826c016c13" ON "121-service"."nedbank_voucher" ("orderCreateReference") `,
    );
    await queryRunner.query(
      `CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFinancialServiceProviderConfigurationLabel", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",'yyyy-mm-dd') AS "registrationCreatedDate", fspconfig."name" AS "programFinancialServiceProviderConfigurationName", fspconfig."id" AS "programFinancialServiceProviderConfigurationId", fspconfig."financialServiceProviderName" AS "financialServiceProviderName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_financial_service_provider_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFinancialServiceProviderConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."nedbank_voucher" DROP CONSTRAINT "FK_739b726eaa8f29ede851906edd3"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_0db7adee73f8cc5c9d44a77e7b"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."nedbank_voucher"`);
  }
}
