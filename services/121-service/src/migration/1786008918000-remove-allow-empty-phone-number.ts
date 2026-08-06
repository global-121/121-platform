import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAllowEmptyPhoneNumber1786008918000 implements MigrationInterface {
  name = 'RemoveAllowEmptyPhoneNumber1786008918000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Move the "allow empty phone number" setting to the phoneNumber attribute's isRequired property (inverted).
    await queryRunner.query(
      `UPDATE "121-service"."program_registration_attribute" AS pra
       SET "isRequired" = NOT p."allowEmptyPhoneNumber"
       FROM "121-service"."program" AS p
       WHERE pra."programId" = p."id" AND pra."name" = 'phoneNumber'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "allowEmptyPhoneNumber"`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    console.log('we do not revert');
  }
}
