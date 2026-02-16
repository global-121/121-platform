import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRegistrationAttributeConstraints1771234126756 implements MigrationInterface {
  name = 'UpdateRegistrationAttributeConstraints1771234126756';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" DROP CONSTRAINT "CHK_4bf915660b25bdb76415741788"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ADD CONSTRAINT "CHK_07214f8a9faa0e064d3189a1cf" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'registrationProgramId', 'maxPayments', 'paymentCount', 'paymentCountRemaining', 'programId', 'created', 'fspName', 'programFspConfigurationId', 'programFspConfigurationName', 'programFspConfigurationLabel', 'personAffectedSequence', 'lastMessageStatus', 'scope', 'duplicateStatus', 'program', 'data', 'dataSearchBy', 'transactions'))`,
    );
  }

  public async down(_: QueryRunner): Promise<void> {
    console.log('Progress is the way, cannot revert to previous state');
  }
}
