import { MigrationInterface, QueryRunner } from 'typeorm';

export class registrationData1656410775152 implements MigrationInterface {
  name = 'registrationData1656410775152';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."monitoring_question" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "intro" json NOT NULL, "conclusion" json NOT NULL, "options" json, "instanceId" integer, CONSTRAINT "PK_7d225f0ae96964bfdffe7ea5a97" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_80cd1fc99c776e1893c667b4b2" ON "121-service"."monitoring_question" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."registration_data" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "programQuestionId" integer NOT NULL, "fspQuestionId" integer NOT NULL, "programCustomAttributeId" integer NOT NULL, "monitoringQuestionId" integer NOT NULL, "value" character varying NOT NULL, "registrationId" integer, CONSTRAINT "PK_ab77c4514c4e6be63475361e6ae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f07a1f50a3d185ac010a45b47e" ON "121-service"."registration_data" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" DROP COLUMN "monitoringQuestion"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP COLUMN "customData"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD "customData" json NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" ADD "monitoringQuestion" json`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_f07a1f50a3d185ac010a45b47e"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."registration_data"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_80cd1fc99c776e1893c667b4b2"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."monitoring_question"`);
  }
}
