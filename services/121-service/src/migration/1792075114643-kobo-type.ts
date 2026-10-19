import { MigrationInterface, QueryRunner } from 'typeorm';

export class KoboType1792075114643 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add a new column "koboType" to the program_registration_attribute table.
    // It stores the question type that Kobo reported (for example "calculate",
    // "integer" or "text"), next to the 121 "type" column.
    // "character varying" is PostgreSQL's name for a text column of any length.
    // It matches the entity decorator @Column({ type: 'character varying' }), and it is the
    // same column type that the existing "type" column uses. The list of allowed values
    // is enforced in TypeScript (the KoboSurveyItemType enum), not in the database, so a
    // new Kobo question type never needs a database change.
    // Without a NOT NULL, PostgreSQL makes the new column nullable, and every existing
    // row simply gets NULL.
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ADD "koboType" character varying`,
    );
    // Explicitly allow NULL in "koboType". Attributes that were not created from Kobo
    // (for example, created directly via the 121 API) have no Kobo type, and rows that
    // existed before this migration have no value either.
    // Note: a column added with ADD is already nullable, so this statement has no effect
    // on the new column. TypeORM generated the same pair of statements for "koboLabel".
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "koboType" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the "koboType" column from the program_registration_attribute table.
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" DROP COLUMN "koboType"`,
    );
  }
}
