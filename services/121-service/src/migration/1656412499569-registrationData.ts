import { MigrationInterface, QueryRunner } from 'typeorm';

// This entity was copied here during the deletion of monitoringQuestions and everything related to it

export class registrationData1656412499569 implements MigrationInterface {
  name = 'registrationData1656412499569';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."monitoring_question" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "intro" json NOT NULL, "conclusion" json NOT NULL, "options" json, CONSTRAINT "PK_7d225f0ae96964bfdffe7ea5a97" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_80cd1fc99c776e1893c667b4b2" ON "121-service"."monitoring_question" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" ADD "monitoringQuestionId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" ADD CONSTRAINT "UQ_08faaae1dc458def2084456b201" UNIQUE ("monitoringQuestionId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" ADD CONSTRAINT "FK_08faaae1dc458def2084456b201" FOREIGN KEY ("monitoringQuestionId") REFERENCES "121-service"."monitoring_question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."registration_data" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "registrationId" integer NOT NULL, "programQuestionId" integer, "fspQuestionId" integer, "programCustomAttributeId" integer, "monitoringQuestionId" integer, "value" character varying NOT NULL, CONSTRAINT "PK_ab77c4514c4e6be63475361e6ae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f07a1f50a3d185ac010a45b47e" ON "121-service"."registration_data" ("registrationId", "programQuestionId", "fspQuestionId", "programCustomAttributeId", "monitoringQuestionId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "fullnameNamingConvention" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "FK_65982d6021412781740a70c8957" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "FK_c2c4546b67d8c8a1408f6ce59bb" FOREIGN KEY ("programQuestionId") REFERENCES "121-service"."program_question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "FK_58b2a3b937d3b3dbf30c4d328b2" FOREIGN KEY ("fspQuestionId") REFERENCES "121-service"."fsp_attribute"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "FK_7c8169d995fc6cf0fa1a2e46f92" FOREIGN KEY ("programCustomAttributeId") REFERENCES "121-service"."program_custom_attribute"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "FK_bce69bd7a9b0e0a3aecf5e97c92" FOREIGN KEY ("monitoringQuestionId") REFERENCES "121-service"."monitoring_question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.commitTransaction();
    // await this.migrateData(queryRunner.manager);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP COLUMN "customData"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD "customData" json NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" DROP CONSTRAINT "FK_08faaae1dc458def2084456b201"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" DROP CONSTRAINT "UQ_08faaae1dc458def2084456b201"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" DROP COLUMN "monitoringQuestionId"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_80cd1fc99c776e1893c667b4b2"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_f07a1f50a3d185ac010a45b47e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "FK_bce69bd7a9b0e0a3aecf5e97c92"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "FK_7c8169d995fc6cf0fa1a2e46f92"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "FK_58b2a3b937d3b3dbf30c4d328b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "FK_c2c4546b67d8c8a1408f6ce59bb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "FK_65982d6021412781740a70c8957"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."registration_data"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_80cd1fc99c776e1893c667b4b2"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."monitoring_question"`);
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "fullnameNamingConvention"`,
    );
  }
}
