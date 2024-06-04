import { MigrationInterface, QueryRunner } from 'typeorm';

export class UniqueTemplates1703251753260 implements MigrationInterface {
  name = 'UniqueTemplates1703251753260';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ADD CONSTRAINT "uniqueTemplatePerTypeLanguageProgram" UNIQUE ("type", "language", "programId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" DROP CONSTRAINT "uniqueTemplatePerTypeLanguageProgram"`,
    );
  }
}
