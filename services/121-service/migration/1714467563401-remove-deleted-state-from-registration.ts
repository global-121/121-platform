import { MigrationInterface, QueryRunner } from 'typeorm';

const registrationStatus = 'deleted';

export class RemoveDeletedStateFromRegistration1714467563401
  implements MigrationInterface
{
  name = 'RemoveDeletedStateFromRegistration1714467563401';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.time('RemoveDeletedStateFromRegistration1714467563401');
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
    console.timeEnd('RemoveDeletedStateFromRegistration1714467563401');
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
