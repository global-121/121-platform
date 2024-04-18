import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateNoLongerEligibleToDeclined1713422095087
  implements MigrationInterface
{
  name = 'MigrateNoLongerEligibleToDeclined1713422095087';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.time('migrateNoLongerEligibleToDeclined');
    await queryRunner.query(
      `UPDATE "121-service"."registration"
             SET "registrationStatus" = 'declined'
             WHERE "registrationStatus" = 'noLongerEligible'`,
    );
    console.timeEnd('migrateNoLongerEligibleToDeclined');
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
