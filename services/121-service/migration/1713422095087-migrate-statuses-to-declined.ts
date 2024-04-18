import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateStatusesToDeclined1713422095087
  implements MigrationInterface
{
  name = 'MigrateStatusesToDeclined1713422095087';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "121-service"."registration"
             SET "registrationStatus" = 'declined'
             WHERE "registrationStatus" IN ('inclusionEnded', 'rejected', 'noLongerEligible')`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
