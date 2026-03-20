import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScopeToProgramAttachment1774000000000 implements MigrationInterface {
  name = 'AddScopeToProgramAttachment1774000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_attachment" ADD "scope" character varying NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_attachment" DROP COLUMN "scope"`,
    );
  }
}
