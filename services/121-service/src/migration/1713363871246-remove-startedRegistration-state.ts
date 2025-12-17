import { MigrationInterface, QueryRunner } from 'typeorm';

const registrationStatus = 'startedRegistration';

export class RemoveStartedRegistrationState1713363871246 implements MigrationInterface {
  name = 'RemoveStartedRegistrationState1713363871246';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.commitTransaction();

    await queryRunner.query(`DELETE FROM "121-service".note WHERE "registrationId" IN
        (SELECT "id" FROM "121-service"."registration" WHERE "registrationStatus" = '${registrationStatus}')`);

    await queryRunner.query(`DELETE FROM "121-service".event_attribute WHERE "eventId" IN
      (SELECT id FROM "121-service"."event" WHERE "registrationId" IN
      (SELECT "id" FROM "121-service"."registration" WHERE "registrationStatus" = '${registrationStatus}'))`);

    await queryRunner.query(`DELETE FROM "121-service"."event" WHERE "registrationId" IN
      (SELECT "id" FROM "121-service"."registration" WHERE "registrationStatus" = '${registrationStatus}')`);

    await queryRunner.query(`DELETE FROM "121-service".registration_data WHERE "registrationId" IN
      (SELECT "id" FROM "121-service"."registration" WHERE "registrationStatus" = '${registrationStatus}')`);

    await queryRunner.query(`DELETE FROM "121-service".note WHERE "registrationId" IN
      (SELECT "id" FROM "121-service"."registration" WHERE "registrationStatus" = '${registrationStatus}')`);

    await queryRunner.query(
      `DELETE FROM "121-service"."registration" WHERE "registrationStatus" = '${registrationStatus}'`,
    );

    await queryRunner.startTransaction();
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }
}
