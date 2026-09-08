import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDeletedStateFromRegistration1714467563401 implements Omit<
  MigrationInterface,
  'down'
> {
  name = 'RemoveDeletedStateFromRegistration1714467563401';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.commitTransaction();

    const queryCondition = `"fspId" is null AND "registrationStatus" = 'deleted'`;

    await queryRunner.query(`DELETE FROM "121-service".event_attribute WHERE "eventId" IN
      (SELECT id FROM "121-service"."event" WHERE "registrationId" IN
      (SELECT "id" FROM "121-service"."registration" WHERE ${queryCondition}))`);

    await queryRunner.query(`DELETE FROM "121-service"."event" WHERE "registrationId" IN
      (SELECT "id" FROM "121-service"."registration" WHERE ${queryCondition})`);

    await queryRunner.query(`DELETE FROM "121-service".registration_data WHERE "registrationId" IN
      (SELECT "id" FROM "121-service"."registration" WHERE ${queryCondition})`);

    await queryRunner.query(`DELETE FROM "121-service".whatsapp_pending_message WHERE "registrationId" IN
      (SELECT "id" FROM "121-service"."registration" WHERE ${queryCondition});`);

    await queryRunner.query(`DELETE FROM "121-service".try_whatsapp WHERE "registrationId" IN
      (SELECT "id" FROM "121-service"."registration" WHERE ${queryCondition});`);

    await queryRunner.query(`DELETE FROM "121-service".note WHERE "registrationId" IN
      (SELECT "id" FROM "121-service"."registration" WHERE ${queryCondition})`);

    await queryRunner.query(`DELETE FROM "121-service".program_answer WHERE "registrationId" IN
      (SELECT "id" FROM "121-service"."registration" WHERE ${queryCondition})`);

    await queryRunner.query(`DELETE FROM "121-service".latest_message WHERE "registrationId" IN
      (SELECT "id" FROM "121-service"."registration" WHERE ${queryCondition})`);

    await queryRunner.query(`DELETE FROM "121-service".twilio_message WHERE "registrationId" IN
      (SELECT "id" FROM "121-service"."registration" WHERE ${queryCondition})`);

    await queryRunner.query(
      `DELETE FROM "121-service"."registration" WHERE ${queryCondition}`,
    );

    await queryRunner.startTransaction();
  }
}
