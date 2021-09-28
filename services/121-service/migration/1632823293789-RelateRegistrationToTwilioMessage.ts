import { MigrationInterface, QueryRunner } from 'typeorm';

export class RelateRegistrationToTwilioMessage1632823293789
  implements MigrationInterface {
  name = 'RelateRegistrationToTwilioMessage1632823293789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD "registrationId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."people_affected_app_data" ADD CONSTRAINT "FK_578c6c920a1b5e7c87a7148eb49" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ADD CONSTRAINT "FK_16ab80e3d29fab4db86caa37b3b" FOREIGN KEY ("fspId") REFERENCES "121-service"."fsp"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_d3c35664dbb056d04694819316e" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_ba98ea5ca43ebe54f60c5aaabec" FOREIGN KEY ("financialServiceProviderId") REFERENCES "121-service"."fsp"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_3a2576be389f520bece9d7dbb98" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_answer" ADD CONSTRAINT "FK_2549b5b88f24202a727b0839d0b" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_answer" ADD CONSTRAINT "FK_2b3e7f20484ff841e148a1bf9ef" FOREIGN KEY ("programQuestionId") REFERENCES "121-service"."program_question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD CONSTRAINT "FK_b34adfcf6ebd3c2536d35dfbf6c" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" ADD CONSTRAINT "FK_b60be4bf492f3ee8745dfee8806" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" ADD CONSTRAINT "FK_1315d078dc3df552bba424c032b" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."action" ADD CONSTRAINT "FK_b2e3f7568dafa9e86ae03910111" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."action" ADD CONSTRAINT "FK_20a407367336fd4352de7f8138f" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_status_change" ADD CONSTRAINT "FK_dde01a7a751285564545fe8ac50" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" ADD CONSTRAINT "FK_4d11d92320228c5ca4634e37140" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" ADD CONSTRAINT "FK_aef8b3f9b3e14b63f1f414e814d" FOREIGN KEY ("barcodeId") REFERENCES "121-service"."intersolve_barcode"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "FK_9de58ca3e7c32731a9f6aa3d02f" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_5423104a960c57439e028eb57c5" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_af6d07a8391d587c4dd40e7a5a9" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345" FOREIGN KEY ("fspId") REFERENCES "121-service"."fsp"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment_roles_user_role" ADD CONSTRAINT "FK_8b938a5145fb00a8e324504f620" FOREIGN KEY ("programAidworkerAssignmentId") REFERENCES "121-service"."program_aidworker_assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment_roles_user_role" ADD CONSTRAINT "FK_55d6e02b7aed4a6cbd027cc97d6" FOREIGN KEY ("userRoleId") REFERENCES "121-service"."user_role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_providers_fsp" ADD CONSTRAINT "FK_d4a02cfb88f16abd41454253e40" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_providers_fsp" ADD CONSTRAINT "FK_94f4ed0a4cb054f80878db020d1" FOREIGN KEY ("fspId") REFERENCES "121-service"."fsp"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_providers_fsp" DROP CONSTRAINT "FK_94f4ed0a4cb054f80878db020d1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_providers_fsp" DROP CONSTRAINT "FK_d4a02cfb88f16abd41454253e40"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment_roles_user_role" DROP CONSTRAINT "FK_55d6e02b7aed4a6cbd027cc97d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment_roles_user_role" DROP CONSTRAINT "FK_8b938a5145fb00a8e324504f620"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_af6d07a8391d587c4dd40e7a5a9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_5423104a960c57439e028eb57c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "FK_9de58ca3e7c32731a9f6aa3d02f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" DROP CONSTRAINT "FK_aef8b3f9b3e14b63f1f414e814d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" DROP CONSTRAINT "FK_4d11d92320228c5ca4634e37140"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_status_change" DROP CONSTRAINT "FK_dde01a7a751285564545fe8ac50"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."action" DROP CONSTRAINT "FK_20a407367336fd4352de7f8138f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."action" DROP CONSTRAINT "FK_b2e3f7568dafa9e86ae03910111"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" DROP CONSTRAINT "FK_1315d078dc3df552bba424c032b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" DROP CONSTRAINT "FK_b60be4bf492f3ee8745dfee8806"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP CONSTRAINT "FK_b34adfcf6ebd3c2536d35dfbf6c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_answer" DROP CONSTRAINT "FK_2b3e7f20484ff841e148a1bf9ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_answer" DROP CONSTRAINT "FK_2549b5b88f24202a727b0839d0b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_3a2576be389f520bece9d7dbb98"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_ba98ea5ca43ebe54f60c5aaabec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_d3c35664dbb056d04694819316e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" DROP CONSTRAINT "FK_16ab80e3d29fab4db86caa37b3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."people_affected_app_data" DROP CONSTRAINT "FK_578c6c920a1b5e7c87a7148eb49"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP COLUMN "registrationId"`,
    );
  }
}
