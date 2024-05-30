import { MigrationInterface, QueryRunner } from 'typeorm';

const healthAreaQuestion = {
  name: 'healthArea',
  label: {
    en: 'Health area',
    fr: 'Aire de santé',
  },
  shortLabel: {
    // FYI shortLabel has been refactored into label since this was created
    en: 'Health area',
    fr: 'Aire de santé',
  },
  answerType: 'text',
  options: null,
  persistence: true,
  export: ['all-people-affected', 'included'],
};

export class UpdateVodacash1710258612887 implements MigrationInterface {
  name = 'UpdateVodacash1710258612887';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const vodacash = await queryRunner.query(
      `SELECT * FROM "121-service"."financial_service_provider" WHERE "fsp" = 'VodaCash'`,
    );
    if (vodacash && vodacash.length > 0) {
      const id = vodacash[0].id;
      const fspQuestionExists = await queryRunner.query(
        `SELECT * FROM "121-service"."financial_service_provider_question" WHERE "fspId" = ${id} and name = 'healthArea'`,
      );

      if (!fspQuestionExists || fspQuestionExists.length === 0) {
        await queryRunner.query(
          `INSERT INTO "121-service"."financial_service_provider_question" ("fspId", "name", "export", "answerType", "shortLabel", "label") VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            id,
            healthAreaQuestion.name,
            JSON.stringify(healthAreaQuestion.export),
            healthAreaQuestion.answerType,
            JSON.stringify(healthAreaQuestion.shortLabel),
            JSON.stringify(healthAreaQuestion.label),
          ],
        );
      }
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }
}
