import { MigrationInterface, QueryRunner } from 'typeorm';

export class uniqueRegistrationData1661862097120 implements MigrationInterface {
  name = 'uniqueRegistrationData1661862097120';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "registrationMonitoringQuestionUnique" UNIQUE ("registrationId", "monitoringQuestionId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "registrationProgramCustomAttributeUnique" UNIQUE ("registrationId", "programCustomAttributeId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "registrationFspQuestionUnique" UNIQUE ("registrationId", "fspQuestionId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "registrationProgramQuestionUnique" UNIQUE ("registrationId", "programQuestionId")`,
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
      `ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "registrationProgramCustomAttributeUnique"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "registrationMonitoringQuestionUnique"`,
    );
  }
}
