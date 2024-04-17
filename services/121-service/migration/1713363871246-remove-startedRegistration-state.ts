import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveStartedRegistrationState1713363871246
  implements MigrationInterface
{
  name = 'RemoveStartedRegistrationState1713363871246';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.time('RemoveStartedRegistrationState1713363871246');

    await queryRunner.query(
      `DELETE FROM "121-service"."registration"
             WHERE "registrationStatus" = 'startedRegistration'`,
    );

    console.timeEnd('RemoveStartedRegistrationState1713363871246');
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
