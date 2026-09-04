import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDuplicateScopeRegistrationAttributes1788361774000
  implements MigrationInterface
{
  name = 'RemoveDuplicateScopeRegistrationAttributes1788361774000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."program_registration_attribute" AS "programRegistrationAttribute"
       USING "121-service"."program" AS "program"
       WHERE "programRegistrationAttribute"."programId" = "program"."id"
         AND LOWER("programRegistrationAttribute"."name") = $1
         AND "program"."enableScope" = true`,
      ['scope'],
    );
  }

  public down(_queryRunner: QueryRunner): Promise<void> {
    return Promise.resolve();
  }
}
