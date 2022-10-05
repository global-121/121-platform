import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRegistrationDataUniqueConstraints1664371029551
  implements MigrationInterface {
  name = 'UpdateRegistrationDataUniqueConstraints1664371029551';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "registrationProgramQuestionUnique"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "registrationFspQuestionUnique"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "registrationFspQuestionUnique" UNIQUE ("registrationId", "fspQuestionId", "value")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "registrationProgramQuestionUnique" UNIQUE ("registrationId", "programQuestionId", "value")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "registrationProgramQuestionUnique"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "registrationFspQuestionUnique"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "registrationProgramQuestionUnique" UNIQUE ("registrationId", "programQuestionId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "registrationFspQuestionUnique" UNIQUE ("registrationId", "fspQuestionId")`,
    );
  }
}
