import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorOnDelete1733492799598 implements MigrationInterface {
  name = 'RefactorOnDelete1733492799598';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."event_attribute" DROP CONSTRAINT "FK_9c065981c6e17cc1d076985fbba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."event" DROP CONSTRAINT "FK_497c4072a86797298c1c0cf776c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT "FK_10994d027e2fbaf4ff8e8bf5f45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT "FK_a218fd8d386666984192f306367"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration" DROP CONSTRAINT "FK_f7400125e09c4d8fec5747ec588"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_d3c35664dbb056d04694819316e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_3a2576be389f520bece9d7dbb98"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "FK_cd56d3267e8553557ec97c6741b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "FK_9de58ca3e7c32731a9f6aa3d02f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_message" DROP CONSTRAINT "FK_2a2f05ef6c49d8b6f86a27e55c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_message" DROP CONSTRAINT "FK_b1e5575d941a3f0ce8430c0edfb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" DROP CONSTRAINT "FK_a7153217f085fbb3a6e30588c4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_child_wallet" DROP CONSTRAINT "FK_59ddd28d67a179d138682da697a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_parent_wallet" DROP CONSTRAINT "FK_2975915495fd7289eaad6f47050"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" DROP CONSTRAINT "FK_ad00c730226a462624de94041ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" DROP CONSTRAINT "FK_e64e394d9af2d9096bd29732ab6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" DROP CONSTRAINT "FK_4d11d92320228c5ca4634e37140"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_5423104a960c57439e028eb57c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."note" DROP CONSTRAINT "FK_a341b2f46655af6d3d8356f2b4f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" DROP CONSTRAINT "FK_1315d078dc3df552bba424c032b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" DROP CONSTRAINT "FK_b60be4bf492f3ee8745dfee8806"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."action" DROP CONSTRAINT "FK_20a407367336fd4352de7f8138f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" DROP CONSTRAINT "FK_55ebe1d2e603be11a0cfc97372f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" DROP CONSTRAINT "FK_8788ebf12909c03049a0d8c377d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_attribute_data" DROP CONSTRAINT "FK_3bd62b57d06901bcd85e28fd060"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_attribute_data" DROP CONSTRAINT "FK_8914b71c0e30c44291ab68a9b8a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."try_whatsapp" DROP CONSTRAINT "FK_f9302bf2f79e322f0e35357e80a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial_bank_ethiopia_account_enquiries" DROP CONSTRAINT "FK_91a620467ab21f97439b6d6b90a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher_instruction" DROP CONSTRAINT "FK_a4b70f5b341879f17bd410e8d52"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_transfer" DROP CONSTRAINT "FK_71eecfc6a9376e289b2a52cdf55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT "registrationPaymentLatestTransactionUnique"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ALTER COLUMN "registrationId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ALTER COLUMN "transactionId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ALTER COLUMN "registrationId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_message" ALTER COLUMN "messageId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" ALTER COLUMN "registrationId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."try_whatsapp" ALTER COLUMN "registrationId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial_bank_ethiopia_account_enquiries" ALTER COLUMN "registrationId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher_instruction" ALTER COLUMN "programId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "registrationPaymentLatestTransactionUnique" UNIQUE ("registrationId", "payment")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."event_attribute" ADD CONSTRAINT "FK_9c065981c6e17cc1d076985fbba" FOREIGN KEY ("eventId") REFERENCES "121-service"."event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."event" ADD CONSTRAINT "FK_497c4072a86797298c1c0cf776c" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "FK_a218fd8d386666984192f306367" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "FK_10994d027e2fbaf4ff8e8bf5f45" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration" ADD CONSTRAINT "FK_f7400125e09c4d8fec5747ec588" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_d3c35664dbb056d04694819316e" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_3a2576be389f520bece9d7dbb98" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "FK_9de58ca3e7c32731a9f6aa3d02f" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "FK_cd56d3267e8553557ec97c6741b" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_message" ADD CONSTRAINT "FK_b1e5575d941a3f0ce8430c0edfb" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_message" ADD CONSTRAINT "FK_2a2f05ef6c49d8b6f86a27e55c9" FOREIGN KEY ("messageId") REFERENCES "121-service"."twilio_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" ADD CONSTRAINT "FK_a7153217f085fbb3a6e30588c4b" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_child_wallet" ADD CONSTRAINT "FK_59ddd28d67a179d138682da697a" FOREIGN KEY ("intersolveVisaParentWalletId") REFERENCES "121-service"."intersolve_visa_parent_wallet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_parent_wallet" ADD CONSTRAINT "FK_2975915495fd7289eaad6f47050" FOREIGN KEY ("intersolveVisaCustomerId") REFERENCES "121-service"."intersolve_visa_customer"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" ADD CONSTRAINT "FK_ad00c730226a462624de94041ec" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" ADD CONSTRAINT "FK_4d11d92320228c5ca4634e37140" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" ADD CONSTRAINT "FK_e64e394d9af2d9096bd29732ab6" FOREIGN KEY ("voucherId") REFERENCES "121-service"."intersolve_voucher"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_5423104a960c57439e028eb57c5" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."note" ADD CONSTRAINT "FK_a341b2f46655af6d3d8356f2b4f" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" ADD CONSTRAINT "FK_b60be4bf492f3ee8745dfee8806" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" ADD CONSTRAINT "FK_1315d078dc3df552bba424c032b" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."action" ADD CONSTRAINT "FK_20a407367336fd4352de7f8138f" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ADD CONSTRAINT "FK_55ebe1d2e603be11a0cfc97372f" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ADD CONSTRAINT "FK_8788ebf12909c03049a0d8c377d" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_attribute_data" ADD CONSTRAINT "FK_8914b71c0e30c44291ab68a9b8a" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_attribute_data" ADD CONSTRAINT "FK_3bd62b57d06901bcd85e28fd060" FOREIGN KEY ("programRegistrationAttributeId") REFERENCES "121-service"."program_registration_attribute"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."try_whatsapp" ADD CONSTRAINT "FK_f9302bf2f79e322f0e35357e80a" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial_bank_ethiopia_account_enquiries" ADD CONSTRAINT "FK_91a620467ab21f97439b6d6b90a" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher_instruction" ADD CONSTRAINT "FK_a4b70f5b341879f17bd410e8d52" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_transfer" ADD CONSTRAINT "FK_71eecfc6a9376e289b2a52cdf55" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_transfer" DROP CONSTRAINT "FK_71eecfc6a9376e289b2a52cdf55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher_instruction" DROP CONSTRAINT "FK_a4b70f5b341879f17bd410e8d52"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial_bank_ethiopia_account_enquiries" DROP CONSTRAINT "FK_91a620467ab21f97439b6d6b90a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."try_whatsapp" DROP CONSTRAINT "FK_f9302bf2f79e322f0e35357e80a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_attribute_data" DROP CONSTRAINT "FK_3bd62b57d06901bcd85e28fd060"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_attribute_data" DROP CONSTRAINT "FK_8914b71c0e30c44291ab68a9b8a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" DROP CONSTRAINT "FK_8788ebf12909c03049a0d8c377d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" DROP CONSTRAINT "FK_55ebe1d2e603be11a0cfc97372f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."action" DROP CONSTRAINT "FK_20a407367336fd4352de7f8138f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" DROP CONSTRAINT "FK_1315d078dc3df552bba424c032b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" DROP CONSTRAINT "FK_b60be4bf492f3ee8745dfee8806"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."note" DROP CONSTRAINT "FK_a341b2f46655af6d3d8356f2b4f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_5423104a960c57439e028eb57c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" DROP CONSTRAINT "FK_e64e394d9af2d9096bd29732ab6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" DROP CONSTRAINT "FK_4d11d92320228c5ca4634e37140"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" DROP CONSTRAINT "FK_ad00c730226a462624de94041ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_parent_wallet" DROP CONSTRAINT "FK_2975915495fd7289eaad6f47050"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_child_wallet" DROP CONSTRAINT "FK_59ddd28d67a179d138682da697a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" DROP CONSTRAINT "FK_a7153217f085fbb3a6e30588c4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_message" DROP CONSTRAINT "FK_2a2f05ef6c49d8b6f86a27e55c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_message" DROP CONSTRAINT "FK_b1e5575d941a3f0ce8430c0edfb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "FK_cd56d3267e8553557ec97c6741b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "FK_9de58ca3e7c32731a9f6aa3d02f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_3a2576be389f520bece9d7dbb98"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_d3c35664dbb056d04694819316e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration" DROP CONSTRAINT "FK_f7400125e09c4d8fec5747ec588"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT "FK_10994d027e2fbaf4ff8e8bf5f45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT "FK_a218fd8d386666984192f306367"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."event" DROP CONSTRAINT "FK_497c4072a86797298c1c0cf776c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."event_attribute" DROP CONSTRAINT "FK_9c065981c6e17cc1d076985fbba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT "registrationPaymentLatestTransactionUnique"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher_instruction" ALTER COLUMN "programId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial_bank_ethiopia_account_enquiries" ALTER COLUMN "registrationId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."try_whatsapp" ALTER COLUMN "registrationId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" ALTER COLUMN "registrationId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_message" ALTER COLUMN "messageId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ALTER COLUMN "registrationId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ALTER COLUMN "transactionId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ALTER COLUMN "registrationId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "registrationPaymentLatestTransactionUnique" UNIQUE ("payment", "registrationId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_transfer" ADD CONSTRAINT "FK_71eecfc6a9376e289b2a52cdf55" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher_instruction" ADD CONSTRAINT "FK_a4b70f5b341879f17bd410e8d52" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial_bank_ethiopia_account_enquiries" ADD CONSTRAINT "FK_91a620467ab21f97439b6d6b90a" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."try_whatsapp" ADD CONSTRAINT "FK_f9302bf2f79e322f0e35357e80a" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_attribute_data" ADD CONSTRAINT "FK_8914b71c0e30c44291ab68a9b8a" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_attribute_data" ADD CONSTRAINT "FK_3bd62b57d06901bcd85e28fd060" FOREIGN KEY ("programRegistrationAttributeId") REFERENCES "121-service"."program_registration_attribute"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ADD CONSTRAINT "FK_8788ebf12909c03049a0d8c377d" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ADD CONSTRAINT "FK_55ebe1d2e603be11a0cfc97372f" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."action" ADD CONSTRAINT "FK_20a407367336fd4352de7f8138f" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" ADD CONSTRAINT "FK_b60be4bf492f3ee8745dfee8806" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" ADD CONSTRAINT "FK_1315d078dc3df552bba424c032b" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."note" ADD CONSTRAINT "FK_a341b2f46655af6d3d8356f2b4f" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_5423104a960c57439e028eb57c5" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" ADD CONSTRAINT "FK_4d11d92320228c5ca4634e37140" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" ADD CONSTRAINT "FK_e64e394d9af2d9096bd29732ab6" FOREIGN KEY ("voucherId") REFERENCES "121-service"."intersolve_voucher"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" ADD CONSTRAINT "FK_ad00c730226a462624de94041ec" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_parent_wallet" ADD CONSTRAINT "FK_2975915495fd7289eaad6f47050" FOREIGN KEY ("intersolveVisaCustomerId") REFERENCES "121-service"."intersolve_visa_customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_child_wallet" ADD CONSTRAINT "FK_59ddd28d67a179d138682da697a" FOREIGN KEY ("intersolveVisaParentWalletId") REFERENCES "121-service"."intersolve_visa_parent_wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" ADD CONSTRAINT "FK_a7153217f085fbb3a6e30588c4b" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_message" ADD CONSTRAINT "FK_b1e5575d941a3f0ce8430c0edfb" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_message" ADD CONSTRAINT "FK_2a2f05ef6c49d8b6f86a27e55c9" FOREIGN KEY ("messageId") REFERENCES "121-service"."twilio_message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "FK_9de58ca3e7c32731a9f6aa3d02f" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "FK_cd56d3267e8553557ec97c6741b" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_3a2576be389f520bece9d7dbb98" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_d3c35664dbb056d04694819316e" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration" ADD CONSTRAINT "FK_f7400125e09c4d8fec5747ec588" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "FK_a218fd8d386666984192f306367" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "FK_10994d027e2fbaf4ff8e8bf5f45" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."event" ADD CONSTRAINT "FK_497c4072a86797298c1c0cf776c" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."event_attribute" ADD CONSTRAINT "FK_9c065981c6e17cc1d076985fbba" FOREIGN KEY ("eventId") REFERENCES "121-service"."event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
