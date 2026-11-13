import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProgramAttachmentAccessGroups1794222302269 implements MigrationInterface {
  name = 'ProgramAttachmentAccessGroups1794222302269';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_attachment_access_group" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programAttachmentId" integer NOT NULL, "accessGroupLevelId" integer NOT NULL, "value" character varying NOT NULL, CONSTRAINT "programAttachmentAccessGroupUnique" UNIQUE ("programAttachmentId", "accessGroupLevelId"), CONSTRAINT "PK_64a40ab1263b0871f6383e536a6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a8a8ca20f13174a9cb16d25237" ON "121-service"."program_attachment_access_group" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_program_attachment_access_group_levelId" ON "121-service"."program_attachment_access_group" ("accessGroupLevelId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_attachment_access_group" ADD CONSTRAINT "FK_ecaa6dec7eb4e2cc250aeda81c1" FOREIGN KEY ("programAttachmentId") REFERENCES "121-service"."program_attachment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_attachment_access_group" ADD CONSTRAINT "FK_72f04c0dd8088cab3f19aca44bb" FOREIGN KEY ("accessGroupLevelId") REFERENCES "121-service"."program_access_group_level"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(_: QueryRunner): Promise<void> {
    console.log('no down migration');
  }
}
