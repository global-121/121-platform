import { MigrationInterface, QueryRunner } from 'typeorm';

const registrationStatus = 'startedRegistration';

export class RemoveStartedRegistrationState1713363871246
  implements MigrationInterface
{
  name = 'RemoveStartedRegistrationState1713363871246';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.time('RemoveStartedRegistrationState1713363871246');
    await queryRunner.commitTransaction();

    await queryRunner.query(`DELETE FROM "121-service".event_attribute WHERE "eventId" IN
      (SELECT id FROM "121-service"."event" WHERE "registrationId" IN
      (SELECT "id" FROM "121-service"."registration" WHERE "registrationStatus" = '${registrationStatus}'))`);

    await queryRunner.query(`DELETE FROM "121-service"."event" WHERE "registrationId" IN
      (SELECT "id" FROM "121-service"."registration" WHERE "registrationStatus" = '${registrationStatus}')`);

    await queryRunner.query(`DELETE FROM "121-service".registration_data WHERE "registrationId" IN
      (SELECT "id" FROM "121-service"."registration" WHERE "registrationStatus" = '${registrationStatus}')`);

    await queryRunner.query(
      `DELETE FROM "121-service"."registration" WHERE "registrationStatus" = '${registrationStatus}'`,
    );

    await queryRunner.startTransaction();
    console.timeEnd('RemoveStartedRegistrationState1713363871246');
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
