import {MigrationInterface, QueryRunner} from "typeorm";

export class connectionUpdatedCreated1579090237377 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "121-service"."standard_criterium" ALTER COLUMN "created" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."standard_criterium" ALTER COLUMN "updated" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."custom_criterium" ALTER COLUMN "created" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."custom_criterium" ALTER COLUMN "updated" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."credential_request" ALTER COLUMN "credentialRequest" SET DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "programsEnrolled" SET DEFAULT array[]::integer[]`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "programsIncluded" SET DEFAULT array[]::integer[]`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "programsExcluded" SET DEFAULT array[]::integer[]`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ADD COLUMN IF NOT EXISTS "created" timestamp`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ADD COLUMN IF NOT EXISTS "updated" timestamp`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "created" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "updated" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "schemaId" SET DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "credDefId" SET DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "credOffer" SET DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "proofRequest" SET DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "created" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "updated" SET DEFAULT CURRENT_TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "updated" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "created" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "proofRequest" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "credOffer" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "credDefId" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ALTER COLUMN "schemaId" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "updated" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "created" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "programsExcluded" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "programsIncluded" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "121-service"."connection" ALTER COLUMN "programsEnrolled" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "121-service"."credential_request" ALTER COLUMN "credentialRequest" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "121-service"."custom_criterium" ALTER COLUMN "updated" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."custom_criterium" ALTER COLUMN "created" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."standard_criterium" ALTER COLUMN "updated" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."standard_criterium" ALTER COLUMN "created" SET DEFAULT now()`);
    }

}
