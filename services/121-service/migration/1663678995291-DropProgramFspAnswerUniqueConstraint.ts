import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropProgramAnswerUniqueConstraint1663678995291
  implements MigrationInterface {
  name = 'DropProgramAnswerUniqueConstraint1663678995291';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "registrationProgramQuestionUnique"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "registrationFspQuestionUnique"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "registrationProgramQuestionUnique" UNIQUE ("registrationId", "programQuestionId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "registrationFspQuestionUnique" UNIQUE ("registrationId", "fspQuestionId")`,
    );
  }
}
