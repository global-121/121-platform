import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1632823002006 implements MigrationInterface {
  name = 'InitialMigration1632823002006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."people_affected_app_data" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "type" character varying NOT NULL, "data" character varying NOT NULL, "userId" integer, CONSTRAINT "PK_e58fff57e65fac03d182b54f60b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ca668ee3e45d5433abf3029044" ON "121-service"."people_affected_app_data" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9ffa6705e8ed7f9a5e9ac10779" ON "121-service"."people_affected_app_data" ("type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."fsp_attribute" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "label" json NOT NULL, "placeholder" json, "options" json, "export" json NOT NULL DEFAULT '["all-people-affected","included","selected-for-validation"]', "answerType" character varying NOT NULL, "fspId" integer, CONSTRAINT "PK_ff43e8785d47a2f54eb920bb7e5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a81f3c2a35d30ecae0bb51dea0" ON "121-service"."fsp_attribute" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."fsp" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "fsp" character varying NOT NULL, "fspDisplayName" json, CONSTRAINT "PK_30efcd46b01ee79fa9197a0190f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_18c0b354e186ac0e7350692791" ON "121-service"."fsp" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."transaction" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "amount" integer NOT NULL, "status" character varying NOT NULL, "errorMessage" character varying, "installment" integer NOT NULL DEFAULT '1', "customData" json NOT NULL DEFAULT '{}', "transactionStep" integer NOT NULL DEFAULT '1', "programId" integer, "financialServiceProviderId" integer, "registrationId" integer, CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8abb653ad984db9d9c8c75039e" ON "121-service"."transaction" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_answer" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "programQuestionId" integer NOT NULL, "programAnswer" character varying NOT NULL, "registrationId" integer, CONSTRAINT "PK_dbf60678316a4919b757595f09c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_11212eebe689535773945d3791" ON "121-service"."program_answer" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_question" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "label" json NOT NULL, "answerType" character varying NOT NULL, "placeholder" json, "questionType" character varying NOT NULL, "options" json, "scoring" json NOT NULL, "updated" TIMESTAMP NOT NULL DEFAULT now(), "persistence" boolean NOT NULL DEFAULT false, "export" json NOT NULL DEFAULT '["all-people-affected","included","selected-for-validation"]', "pattern" character varying, "programId" integer, CONSTRAINT "PK_be7bf229f42e8d947648107ba57" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e7c36c1ae8867423ece7db9ff3" ON "121-service"."program_question" ("created") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_deab61a6961866dafe5ce61426" ON "121-service"."program_question" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."user_role" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "role" character varying NOT NULL, "label" character varying, CONSTRAINT "PK_fb2e442d14add3cefbdf33c4561" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7c795708ffb9aba0b75bb47d47" ON "121-service"."user_role" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_aidworker_assignment" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "programId" integer, CONSTRAINT "PK_efe02f5a686dacf4d1d4ec06939" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0e82cb4d2ae009af92e6fb7271" ON "121-service"."program_aidworker_assignment" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."program" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "phase" character varying NOT NULL DEFAULT 'design', "location" character varying, "title" json, "ngo" character varying, "startDate" TIMESTAMP, "endDate" TIMESTAMP, "currency" character varying, "distributionFrequency" character varying, "distributionDuration" integer, "fixedTransferValue" integer, "inclusionCalculationType" character varying, "minimumScore" integer, "highestScoresX" integer, "meetingDocuments" json, "notifications" json, "phoneNumberPlaceholder" character varying, "description" json, "descLocation" json, "descHumanitarianObjective" json, "descCashType" json, "published" boolean NOT NULL DEFAULT false, "validation" boolean NOT NULL DEFAULT true, "updated" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3bade5945afbafefdd26a3a29fb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bc351c7a1289829b04cb2b22b0" ON "121-service"."program" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."action" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "actionType" character varying NOT NULL, "userId" integer, "programId" integer, CONSTRAINT "PK_2d9db9cf5edfbbae74eb56e3a39" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_11b9a4c3dc12295f06c2671649" ON "121-service"."action" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."user" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "username" character varying, "password" character varying NOT NULL, "userType" character varying NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8ce4c93ba419b56bd82e533724" ON "121-service"."user" ("created") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_78a916df40e02a9deb1c4b75ed" ON "121-service"."user" ("username") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."registration_status_change" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "registrationStatus" character varying NOT NULL, "registrationId" integer, CONSTRAINT "PK_4446238d6beee603dc7274555ce" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5d19bd3d22c0511e32083015de" ON "121-service"."registration_status_change" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_be4a07fb06df0e5a3691c16554" ON "121-service"."registration_status_change" ("registrationStatus") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."intersolve_barcode" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "installment" integer, "whatsappPhoneNumber" character varying, "pin" character varying NOT NULL, "barcode" character varying NOT NULL, "amount" integer, "send" boolean, "balanceUsed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_e0aa55d6b5647d7876bf30ef275" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2324fbeeaf2f98950c20b1d845" ON "121-service"."intersolve_barcode" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."imagecode_export_vouchers" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "image" bytea NOT NULL, "registrationId" integer, "barcodeId" integer, CONSTRAINT "PK_3a8e763ef5450881aed59b8d53b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eb71350dce5f48c79b345c3dec" ON "121-service"."imagecode_export_vouchers" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."twilio_message" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "accountSid" character varying NOT NULL, "body" character varying NOT NULL, "to" character varying NOT NULL, "from" character varying NOT NULL, "sid" character varying NOT NULL, "status" character varying NOT NULL, "type" character varying NOT NULL, "dateCreated" TIMESTAMP NOT NULL, CONSTRAINT "PK_90f8a98a4627d7bea1c87658e4a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_db6cc311d95c3aa694962e0321" ON "121-service"."twilio_message" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."registration" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "registrationStatus" character varying, "qrIdentifier" character varying, "referenceId" character varying NOT NULL, "customData" json NOT NULL DEFAULT '{}', "phoneNumber" character varying, "preferredLanguage" character varying, "inclusionScore" integer, "namePartnerOrganization" character varying, "paymentAmountMultiplier" integer, "note" character varying, "noteUpdated" TIMESTAMP, "programId" integer, "userId" integer, "fspId" integer, CONSTRAINT "PK_cb23dc9d28df8801b15e9e2b8d6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a29494ba77e209af30134f3263" ON "121-service"."registration" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a0e358e5f4d04cb13baf513546" ON "121-service"."registration" ("registrationStatus") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9b90a3cf845d50fabe2aea1d03" ON "121-service"."registration" ("referenceId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4441e58f7680bf6f3f92005500" ON "121-service"."registration" ("inclusionScore") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."at_notification" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "transactionId" character varying NOT NULL, "category" character varying NOT NULL, "provider" character varying NOT NULL, "providerRefId" character varying, "providerChannel" character varying NOT NULL, "clientAccount" character varying, "productName" character varying NOT NULL, "sourceType" character varying NOT NULL, "source" character varying NOT NULL, "destinationType" character varying NOT NULL, "destination" character varying NOT NULL, "value" character varying NOT NULL, "transactionFee" character varying, "providerFee" character varying, "status" character varying NOT NULL, "description" character varying NOT NULL, "requestMetadata" json, "providerMetadata" json, "transactionDate" character varying, CONSTRAINT "PK_f768d5b527b2cbad318ac846200" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_81a33ce3aa20f401499e65872b" ON "121-service"."at_notification" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."intersolve_instruction" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "image" bytea NOT NULL, CONSTRAINT "PK_f2a5951f2c80719fb85a2326328" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_91c99a8ddc738e88f197369431" ON "121-service"."intersolve_instruction" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."intersolve_request" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "refPos" bigint NOT NULL, "EAN" character varying, "value" integer NOT NULL, "clientReference" integer, "resultCodeIssueCard" integer, "cardId" character varying, "PIN" integer, "balance" integer, "transactionId" integer, "isCancelled" boolean NOT NULL DEFAULT false, "cancellationAttempts" integer NOT NULL DEFAULT '0', "cancelByRefPosResultCode" integer, "cancelResultCode" integer, "toCancel" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_345a71747a3fbab761c5a862c25" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_46d83e95510e1d9f01e3b78043" ON "121-service"."intersolve_request" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."instance" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "displayName" json NOT NULL, "logoUrl" json, "dataPolicy" json, "aboutProgram" json, "contactDetails" json, "monitoringQuestion" json, CONSTRAINT "PK_eaf60e4a0c399c9935413e06474" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f5e1732821ebe099cf8cb627ab" ON "121-service"."instance" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."imagecode" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "secret" character varying NOT NULL, "image" bytea NOT NULL, CONSTRAINT "PK_02a96e8ae57c1d205864c2ca7ec" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_96bede9a554aa4d8cb217b39e5" ON "121-service"."imagecode" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_aidworker_assignment_roles_user_role" ("programAidworkerAssignmentId" integer NOT NULL, "userRoleId" integer NOT NULL, CONSTRAINT "PK_48678ebe15e704067f1417f4685" PRIMARY KEY ("programAidworkerAssignmentId", "userRoleId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8b938a5145fb00a8e324504f62" ON "121-service"."program_aidworker_assignment_roles_user_role" ("programAidworkerAssignmentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_55d6e02b7aed4a6cbd027cc97d" ON "121-service"."program_aidworker_assignment_roles_user_role" ("userRoleId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_financial_service_providers_fsp" ("programId" integer NOT NULL, "fspId" integer NOT NULL, CONSTRAINT "PK_4aa98d48ce3a72389d84b44a61d" PRIMARY KEY ("programId", "fspId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d4a02cfb88f16abd41454253e4" ON "121-service"."program_financial_service_providers_fsp" ("programId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_94f4ed0a4cb054f80878db020d" ON "121-service"."program_financial_service_providers_fsp" ("fspId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_94f4ed0a4cb054f80878db020d"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_d4a02cfb88f16abd41454253e4"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."program_financial_service_providers_fsp"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_55d6e02b7aed4a6cbd027cc97d"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_8b938a5145fb00a8e324504f62"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."program_aidworker_assignment_roles_user_role"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_96bede9a554aa4d8cb217b39e5"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."imagecode"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_f5e1732821ebe099cf8cb627ab"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."instance"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_46d83e95510e1d9f01e3b78043"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."intersolve_request"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_91c99a8ddc738e88f197369431"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."intersolve_instruction"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_81a33ce3aa20f401499e65872b"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."at_notification"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_4441e58f7680bf6f3f92005500"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_9b90a3cf845d50fabe2aea1d03"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_a0e358e5f4d04cb13baf513546"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_a29494ba77e209af30134f3263"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."registration"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_db6cc311d95c3aa694962e0321"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."twilio_message"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_eb71350dce5f48c79b345c3dec"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."imagecode_export_vouchers"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_2324fbeeaf2f98950c20b1d845"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."intersolve_barcode"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_be4a07fb06df0e5a3691c16554"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_5d19bd3d22c0511e32083015de"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."registration_status_change"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_78a916df40e02a9deb1c4b75ed"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_8ce4c93ba419b56bd82e533724"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."user"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_11b9a4c3dc12295f06c2671649"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."action"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_bc351c7a1289829b04cb2b22b0"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."program"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_0e82cb4d2ae009af92e6fb7271"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."program_aidworker_assignment"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_7c795708ffb9aba0b75bb47d47"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."user_role"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_deab61a6961866dafe5ce61426"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_e7c36c1ae8867423ece7db9ff3"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."program_question"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_11212eebe689535773945d3791"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."program_answer"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_8abb653ad984db9d9c8c75039e"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."transaction"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_18c0b354e186ac0e7350692791"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."fsp"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_a81f3c2a35d30ecae0bb51dea0"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."fsp_attribute"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_9ffa6705e8ed7f9a5e9ac10779"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_ca668ee3e45d5433abf3029044"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."people_affected_app_data"`,
    );
  }
}
