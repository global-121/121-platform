import {MigrationInterface, QueryRunner} from "typeorm";

export class uniqueQuestionNames1601987933965 implements MigrationInterface {
    name = 'uniqueQuestionNames1601987933965'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."custom_criterium" ADD CONSTRAINT "UQ_413284ec20684114f3aa3223212" UNIQUE ("criterium")`);
        await queryRunner.query(`ALTER TABLE "121-service"."custom_criterium" ALTER COLUMN "created" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."custom_criterium" ALTER COLUMN "updated" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."credential_request" ALTER COLUMN "credentialRequest" SET DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "121-service"."fsp_attribute" ADD CONSTRAINT "UQ_022e2ddcaef22d14ddd38e7ae9f" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "121-service"."fsp_call_log" ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."fsp_call_log" ALTER COLUMN "payload" SET DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "121-service"."fsp_call_log" ALTER COLUMN "response" SET DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "programsApplied" SET DEFAULT array[]::integer[]`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "programsEnrolled" SET DEFAULT array[]::integer[]`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "programsIncluded" SET DEFAULT array[]::integer[]`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "programsRejected" SET DEFAULT array[]::integer[]`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "created" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "updated" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "contactDetails" SET DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "schemaId" SET DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "credDefId" SET DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "credOffer" SET DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "proofRequest" SET DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "created" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "updated" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."standard_criterium" ALTER COLUMN "created" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."standard_criterium" ALTER COLUMN "updated" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."user" ALTER COLUMN "created" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."action" ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."at_notification" ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."at_notification" ALTER COLUMN "requestMetadata" SET DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "121-service"."at_notification" ALTER COLUMN "providerMetadata" SET DEFAULT null`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."at_notification" ALTER COLUMN "providerMetadata" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "121-service"."at_notification" ALTER COLUMN "requestMetadata" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "121-service"."at_notification" ALTER COLUMN "timestamp" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."action" ALTER COLUMN "timestamp" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."user" ALTER COLUMN "created" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."standard_criterium" ALTER COLUMN "updated" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."standard_criterium" ALTER COLUMN "created" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "updated" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "created" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "proofRequest" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "credOffer" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "credDefId" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "schemaId" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "contactDetails" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "updated" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "created" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "programsRejected" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "programsIncluded" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "programsEnrolled" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "programsApplied" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "121-service"."fsp_call_log" ALTER COLUMN "response" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "121-service"."fsp_call_log" ALTER COLUMN "payload" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "121-service"."fsp_call_log" ALTER COLUMN "timestamp" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."fsp_attribute" DROP CONSTRAINT "UQ_022e2ddcaef22d14ddd38e7ae9f"`);
        await queryRunner.query(`ALTER TABLE "121-service"."credential_request" ALTER COLUMN "credentialRequest" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "121-service"."custom_criterium" ALTER COLUMN "updated" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."custom_criterium" ALTER COLUMN "created" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."custom_criterium" DROP CONSTRAINT "UQ_413284ec20684114f3aa3223212"`);
    }

}
