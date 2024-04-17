import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateRejectedToDeclined1711009418282
  implements MigrationInterface
{
  name = 'MigrateRejectedToDeclined1711009418282';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.time('migrateRejectedToDeclined');
    await queryRunner.query(
      `UPDATE "121-service"."registration"
             SET "registrationStatus" = 'declined'
             WHERE "registrationStatus" = 'rejected'`,
    );
    console.timeEnd('migrateRejectedToDeclined');
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
