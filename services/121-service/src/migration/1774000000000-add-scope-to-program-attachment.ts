import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScopeToProgramAttachment1774000000000 implements MigrationInterface {
  name = 'AddScopeToProgramAttachment1774000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_attachment" ADD "scope" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_program_attachment_programId_scope" ON "121-service"."program_attachment" ("programId", "scope")`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    //we don't go down
  }
}
