import { MigrationInterface, QueryRunner } from 'typeorm';

export class whatsappTemplateTest1661253301181 implements MigrationInterface {
  name = 'whatsappTemplateTest1661253301181';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."whatsapp_template_test" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "sid" character varying NOT NULL, "programId" integer NOT NULL, "language" character varying NOT NULL, "messageKey" character varying NOT NULL, "succes" boolean, "callback" character varying, "sessionId" character varying NOT NULL, CONSTRAINT "PK_4e54b333093a5b5411b01f9e40a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f6d1a5c94b04939e126be3e50" ON "121-service"."whatsapp_template_test" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_744096f17fbdd04b58dc7fcd7f" ON "121-service"."whatsapp_template_test" ("sessionId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_744096f17fbdd04b58dc7fcd7f"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_3f6d1a5c94b04939e126be3e50"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."whatsapp_template_test"`,
    );
  }
}
