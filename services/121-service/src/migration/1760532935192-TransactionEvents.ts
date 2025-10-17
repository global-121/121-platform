import { MigrationInterface, QueryRunner } from 'typeorm';

import { env } from '@121-service/src/env';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';

// Show console logs only for NLRC, as they have a lot of transactions and we want to monitor the progress there during release
// Not for other environments to prevent unnecessary log noise when creating a new instance or resetting locally
const showConsoleTime = env.ENV_NAME === 'NLRC';
export class TransactionEvents1760532935192 implements MigrationInterface {
  name = 'TransactionEvents1760532935192';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (showConsoleTime) {
      console.time('Migration TransactionEvents');
    }

    if (showConsoleTime) {
      console.time('general setup');
    }
    const transactionTempTableName = 'transaction_temp';
    // copy original transaction table to a temporary table
    await queryRunner.query(
      `CREATE TABLE "121-service"."${transactionTempTableName}" AS SELECT * FROM "121-service"."transaction"`,
    );

    // TThis is done to be able to truncate the original transaction table
    await this.removeForeignKeys(queryRunner);

    // truncate original transaction table
    await queryRunner.query(`TRUNCATE TABLE "121-service"."transaction"`);

    // create transaction-event
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_fff8ff586a03d469256098b8f86"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_edc9246b11c7368ca48fce10f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_fff8ff586a03d469256098b8f8"`,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."transaction_event" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "type" character varying NOT NULL, "description" character varying NOT NULL, "isSuccessfullyCompleted" boolean NOT NULL, "errorMessage" character varying, "transactionId" integer NOT NULL, "programFspConfigurationId" integer, CONSTRAINT "PK_1b4101c76f4a2c8168aeb8f3bad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b636b04e270121a24f08d1af9b" ON "121-service"."transaction_event" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_695faaebd651cc12b4b295880d" ON "121-service"."transaction_event" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f4f1b2124aaac715c149460ef4" ON "121-service"."transaction_event" ("transactionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ccc33883aa7599801353e53cf1" ON "121-service"."transaction_event" ("programFspConfigurationId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "errorMessage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "customData"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "transactionStep"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "programFspConfigurationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "transferValue" real`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction_event" ADD CONSTRAINT "FK_a6376dce877de0841fe63085ad4" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction_event" ADD CONSTRAINT "FK_f4f1b2124aaac715c149460ef45" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction_event" ADD CONSTRAINT "FK_ccc33883aa7599801353e53cf19" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // create last-transaction-event
    await queryRunner.query(
      `CREATE TABLE "121-service"."last_transaction_event" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "transactionId" integer NOT NULL, "transactionEventId" integer NOT NULL, CONSTRAINT "REL_3c4cceaad30f521ac0074c45ad" UNIQUE ("transactionId"), CONSTRAINT "REL_0de93dafac190577420226cf69" UNIQUE ("transactionEventId"), CONSTRAINT "PK_c0093d25972670d66a61268ef37" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_318d184fe0086105b4615c0078" ON "121-service"."last_transaction_event" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3c4cceaad30f521ac0074c45ad" ON "121-service"."last_transaction_event" ("transactionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0de93dafac190577420226cf69" ON "121-service"."last_transaction_event" ("transactionEventId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."last_transaction_event" ADD CONSTRAINT "FK_3c4cceaad30f521ac0074c45ad7" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."last_transaction_event" ADD CONSTRAINT "FK_0de93dafac190577420226cf69f" FOREIGN KEY ("transactionEventId") REFERENCES "121-service"."transaction_event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // recreate registration view
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    await queryRunner.query(`CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "created", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFspConfigurationLabel", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", fspconfig."name" AS "programFspConfigurationName", fspconfig."id" AS "programFspConfigurationId", fspconfig."fspName" AS "fspName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus",
        (CASE
            WHEN dup."registrationId" IS NOT NULL THEN 'duplicate'
        ELSE 'unique'
        END)
         AS "duplicateStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFspConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId"  LEFT JOIN (SELECT distinct d1."registrationId" FROM "121-service"."registration_attribute_data" "d1" INNER JOIN "121-service"."registration_attribute_data" "d2" ON d1."programRegistrationAttributeId" = d2."programRegistrationAttributeId" AND "d1"."value" = "d2"."value" AND d1."registrationId" != d2."registrationId"  INNER JOIN "121-service"."registration" "registration1" ON d1."registrationId" = "registration1"."id" AND registration1."registrationStatus" != 'declined'  INNER JOIN "121-service"."registration" "registration2" ON d2."registrationId" = "registration2"."id" AND registration2."registrationStatus" != 'declined'  INNER JOIN "121-service"."program_registration_attribute" "pra" ON d1."programRegistrationAttributeId" = "pra"."id" WHERE "d1"."value" != '' AND pra."duplicateCheck" = true AND
              NOT EXISTS (
                SELECT 1
                FROM "121-service".unique_registration_pair rup
                WHERE rup."smallerRegistrationId" = LEAST(d1."registrationId", d2."registrationId")
                  AND rup."largerRegistrationId" = GREATEST(d1."registrationId", d2."registrationId")
              )) "dup" ON "registration"."id" = dup."registrationId" ORDER BY "registration"."registrationProgramId" ASC`);
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_view',
        'SELECT "registration"."id" AS "id", "registration"."created" AS "created", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFspConfigurationLabel", CAST(CONCAT(\'PA #\',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", fspconfig."name" AS "programFspConfigurationName", fspconfig."id" AS "programFspConfigurationId", fspconfig."fspName" AS "fspName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || \': \' || "message"."status",\'no messages yet\') AS "lastMessageStatus", \n        (CASE\n            WHEN dup."registrationId" IS NOT NULL THEN \'duplicate\'\n        ELSE \'unique\'\n        END)\n         AS "duplicateStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFspConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId"  LEFT JOIN (SELECT distinct d1."registrationId" FROM "121-service"."registration_attribute_data" "d1" INNER JOIN "121-service"."registration_attribute_data" "d2" ON d1."programRegistrationAttributeId" = d2."programRegistrationAttributeId" AND "d1"."value" = "d2"."value" AND d1."registrationId" != d2."registrationId"  INNER JOIN "121-service"."registration" "registration1" ON d1."registrationId" = "registration1"."id" AND registration1."registrationStatus" != \'declined\'  INNER JOIN "121-service"."registration" "registration2" ON d2."registrationId" = "registration2"."id" AND registration2."registrationStatus" != \'declined\'  INNER JOIN "121-service"."program_registration_attribute" "pra" ON d1."programRegistrationAttributeId" = "pra"."id" WHERE "d1"."value" != \'\' AND pra."duplicateCheck" = true AND \n              NOT EXISTS (\n                SELECT 1\n                FROM "121-service".unique_registration_pair rup\n                WHERE rup."smallerRegistrationId" = LEAST(d1."registrationId", d2."registrationId")\n                  AND rup."largerRegistrationId" = GREATEST(d1."registrationId", d2."registrationId")\n              )) "dup" ON "registration"."id" = dup."registrationId" ORDER BY "registration"."registrationProgramId" ASC',
      ],
    );

    // create transaction-view
    await queryRunner.query(
      `CREATE VIEW "121-service"."transaction_view_entity" AS SELECT "event"."errorMessage" AS "errorMessage", "event"."programFspConfigurationId" AS "programFspConfigurationId", "fspconfig"."fspName" AS "fspName", "fspconfig"."name" AS "programFspConfigurationName", "fspconfig"."label" AS "programFspConfigurationLabel", t.* FROM "121-service"."transaction" "t" INNER JOIN "121-service"."last_transaction_event" "lte" ON "t"."id" = "lte"."transactionId"  LEFT JOIN "121-service"."transaction_event" "event" ON "lte"."transactionEventId" = "event"."id"  LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "event"."programFspConfigurationId" = "fspconfig"."id"`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'transaction_view_entity',
        'SELECT "event"."errorMessage" AS "errorMessage", "event"."programFspConfigurationId" AS "programFspConfigurationId", "fspconfig"."fspName" AS "fspName", "fspconfig"."name" AS "programFspConfigurationName", "fspconfig"."label" AS "programFspConfigurationLabel", t.* FROM "121-service"."transaction" "t" INNER JOIN "121-service"."last_transaction_event" "lte" ON "t"."id" = "lte"."transactionId"  LEFT JOIN "121-service"."transaction_event" "event" ON "lte"."transactionEventId" = "event"."id"  LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "event"."programFspConfigurationId" = "fspconfig"."id"',
      ],
    );

    if (showConsoleTime) {
      console.timeEnd('general setup');
    }

    ////////////////////////////////////////////////////
    // migrate data from temp table to new structure
    ////////////////////////////////////////////////////
    if (showConsoleTime) {
      console.time('fill transaction table');
    }
    await this.fillTransactionTable(queryRunner);
    if (showConsoleTime) {
      console.timeEnd('fill transaction table');
    }
    if (showConsoleTime) {
      console.time('add created events');
    }
    await this.addTransactionCreatedEvents(queryRunner);
    if (showConsoleTime) {
      console.timeEnd('add created events');
    }
    if (showConsoleTime) {
      console.time('add initiated events');
    }
    await this.addTransactionInitiatedEvents(queryRunner);
    if (showConsoleTime) {
      console.timeEnd('add initiated events');
    }
    if (showConsoleTime) {
      console.time('fill last transaction event table');
    }
    await this.fillLastTransactionEventTable(queryRunner);
    if (showConsoleTime) {
      console.timeEnd('fill last transaction event table');
    }

    ///////////////////////////////////////////////////////
    // Migration that need to happen after the data is in place
    ///////////////////////////////////////////////////////
    // change twilio-message relation with transaction from OneToOne to ManyToOne

    // set transactionId to null in twilio_message where it does not exist in transaction table
    // we use this transactionId to update the transaction for intersolve voucher when we get a callback from twilio, but for transaction not related to the latest transaction this is not relevant anymore
    if (showConsoleTime) {
      console.time('update twilio messages');
    }
    await queryRunner.query(
      `UPDATE "121-service"."twilio_message" tm
          SET "transactionId" = NULL
          FROM (
            SELECT tm.id
            FROM "121-service"."twilio_message" tm
            LEFT JOIN "121-service"."transaction" t ON tm."transactionId" = t."id"
            WHERE tm."transactionId" IS NOT NULL AND t."id" IS NULL
          ) AS missing
          WHERE tm.id = missing.id
        `,
    );
    if (showConsoleTime) {
      console.timeEnd('update twilio messages');
    }

    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "UQ_cd56d3267e8553557ec97c6741b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "FK_cd56d3267e8553557ec97c6741b" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "UQ_5ad8525fef1696e4388e007b4bc" UNIQUE ("registrationId", "paymentId")`,
    );
    ///////////////////////////////////////////////////
    // Cleanup
    ///////////////////////////////////////////////////

    // drop temp table
    await queryRunner.query(
      `DROP TABLE "121-service"."${transactionTempTableName}"`,
    );
    // drop latest_transaction table
    await queryRunner.query(`DROP TABLE "121-service"."latest_transaction"`);

    // reset id sequence of transaction table
    const maxIdTransactionResult = await queryRunner.query(
      `SELECT MAX(id) FROM "121-service"."transaction"`,
    );
    const maxIdTransaction = maxIdTransactionResult[0].max;
    const nextIdTransaction = maxIdTransaction + 1;
    await queryRunner.query(
      `SELECT setval('121-service.transaction_id_seq', ${nextIdTransaction})`,
    );

    // Add back foreign key constraints back
    await this.addForeignKeysBack(queryRunner);

    if (showConsoleTime) {
      console.timeEnd('Migration TransactionEvents');
    }
    // throw new Error('Stop migration for testing');
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // only up
  }

  private async fillTransactionTable(queryRunner: QueryRunner) {
    // Use the latest transaction table to ensure we only have one transaction per registration/payment
    // set latest transaction id as transaction id in the new table so we can use it latest to add transaction events

    const q = `INSERT INTO "121-service"."transaction" (
        id, created, updated, "userId", "transferValue", status, "paymentId", "registrationId"
      )
      SELECT
        t.id,
        lt.created,
        lt.updated,
        t."userId",
        t.amount AS "transferValue",
        t.status,
        t."paymentId",
        t."registrationId"
      FROM "121-service"."transaction_temp" t
      INNER JOIN "121-service".latest_transaction lt ON t.id = lt."transactionId";
      `;
    // Use the the latest transaction timestamps for the created/updated because this probably matches the timestamp of the transaction of that payment for that registration

    await queryRunner.query(q);
  }

  private addTransactionCreatedEvents(queryRunner: QueryRunner) {
    // Will we be sorry later for importing the enums here in a migration...?
    // I am just afraid that if we change the enum name in the code folder before running the migration
    const q = `INSERT INTO "121-service"."transaction_event" (
        created, updated, "userId", type, description, "isSuccessfullyCompleted", "transactionId", "programFspConfigurationId", "errorMessage"
      )
      SELECT
        lt.created,
        lt.created,
        t."userId",
        '${TransactionEventType.created}' AS type,
        '${TransactionEventDescription.created}' AS description,
        true AS "isSuccessfullyCompleted",
        t.id AS "transactionId",
        t."programFspConfigurationId",
        NULL AS "errorMessage"
      FROM "121-service"."transaction_temp" t inner join "121-service".latest_transaction lt ON t.id = lt."transactionId";
      `;
    // We only need one created event per transaction, so joining with latest_transaction to avoid duplicates
    // Use the the latest transaction timestamps for the created/updated of the event because this probably matches the timestamp of the transaction of that payment for that registration
    return queryRunner.query(q);
  }

  private addTransactionInitiatedEvents(queryRunner: QueryRunner) {
    // We decided for now to put all error messages in the initiated event
    // because it's hard to migrate them to the other events as we don't know if the error message belongs the reconcile or initial api request processing step
    // We decided to discard of the intersolve voucher duplicate transaction we have now as it is not important enought to keep
    // We decide to discard of the retry transaction as they are not important enough to keep

    // We added a second to the created timestamp to ensure the created event is before the initiated event
    const q = `INSERT INTO "121-service"."transaction_event" (
        created, updated, "userId", type, description, "isSuccessfullyCompleted", "transactionId", "programFspConfigurationId", "errorMessage"
      )
      SELECT
        t.created + INTERVAL '1 second',
        t.updated + INTERVAL '1 second',
        t."userId",
        '${TransactionEventType.initiated}' AS type,
        '${TransactionEventDescription.initiated}' AS description,
        CASE WHEN t."errorMessage" IS NOT NULL THEN false ELSE true END AS "isSuccessfullyCompleted",
        t.id AS "transactionId",
        t."programFspConfigurationId",
        t."errorMessage" AS "errorMessage"
      FROM "121-service"."transaction_temp" t inner join "121-service".latest_transaction lt ON t.id = lt."transactionId";
      `;
    // We only need one initiated event per transaction, so joining with latest_transaction to avoid duplicates
    // Use the the latest transaction timestamps for the created/updated of the event because this probably matches the timestamp of the transaction of that payment for that registration
    return queryRunner.query(q);
  }

  private async fillLastTransactionEventTable(queryRunner: QueryRunner) {
    const q = `
      INSERT INTO "121-service"."last_transaction_event" ("transactionId", "transactionEventId")
      SELECT et."transactionId" as "transactionId", et.id AS "transactionEventId"
      FROM "121-service".transaction_event et where type = '${TransactionEventType.initiated}'
      `;
    // The latest event should be the initiated event as we do not have any other events yet
    await queryRunner.query(q);
  }

  private async addForeignKeysBack(queryRunner: QueryRunner) {
    // Do not add twilio_message foreign key back as it changed to ManyToOne
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_transfer" ADD CONSTRAINT "FK_71eecfc6a9376e289b2a52cdf55" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Do not add latest_transaction table back as it was dropped
    await queryRunner.query(
      `ALTER TABLE "121-service"."nedbank_voucher" ADD CONSTRAINT "FK_739b726eaa8f29ede851906edd3" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."cbe_transfer" ADD CONSTRAINT "FK_8d179b2bec6e57c9215780e7aad" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."onafriq_transaction" ADD CONSTRAINT "FK_1ef2718a1b73906b2af259cfa30" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  private async removeForeignKeys(queryRunner: QueryRunner) {
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "FK_cd56d3267e8553557ec97c6741b"`,
    );
    // Drop foreign key from safaricom_transfer
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_transfer" DROP CONSTRAINT "FK_71eecfc6a9376e289b2a52cdf55"`,
    );
    // Drop latest transaction foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT "FK_10994d027e2fbaf4ff8e8bf5f45"`,
    );

    // drop FK_739b726eaa8f29ede851906edd3 from nedbank_voucher to transaction to avoid issues with truncating the transaction table
    await queryRunner.query(
      `ALTER TABLE "121-service"."nedbank_voucher" DROP CONSTRAINT "FK_739b726eaa8f29ede851906edd3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."onafriq_transaction" DROP CONSTRAINT "FK_1ef2718a1b73906b2af259cfa30"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."cbe_transfer" DROP CONSTRAINT "FK_8d179b2bec6e57c9215780e7aad"`,
    );
  }
}
