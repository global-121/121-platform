import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateInclusionEndedToDeclined1711009396880
  implements MigrationInterface
{
  name = 'MigrateInclusionEndedToDeclined1711009396880';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.time('migrateInclusionEndedToDeclined');
    await queryRunner.query(
      `UPDATE "121-service"."registration"
             SET "registrationStatus" = 'declined'
             WHERE "registrationStatus" = 'inclusionEnded'`,
    );
    console.timeEnd('migrateInclusionEndedToDeclined');
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
