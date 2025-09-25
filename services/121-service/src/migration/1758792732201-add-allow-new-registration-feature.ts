import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAllowNewRegistrationFeature1758792732201
  implements MigrationInterface
{
  name = 'AddAllowNewRegistrationFeature1758792732201';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" DROP CONSTRAINT "FK_55ebe1d2e603be11a0cfc97372f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" DROP CONSTRAINT "FK_16ea24d04150003a29a346ade61"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" DROP CONSTRAINT "FK_6be88e8576970978a911084534e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_ba98ea5ca43ebe54f60c5aaabec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_3a2576be389f520bece9d7dbb98"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_d3c35664dbb056d04694819316e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT "FK_10994d027e2fbaf4ff8e8bf5f45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT "FK_a218fd8d386666984192f306367"`,
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
      `ALTER TABLE "121-service"."note" DROP CONSTRAINT "FK_a341b2f46655af6d3d8356f2b4f"`,
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
      `ALTER TABLE "121-service"."intersolve_visa_customer" DROP CONSTRAINT "FK_ad00c730226a462624de94041ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" DROP CONSTRAINT "FK_e64e394d9af2d9096bd29732ab6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" DROP CONSTRAINT "FK_4d11d92320228c5ca4634e37140"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_5423104a960c57439e028eb57c5"`,
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
      `DROP INDEX "121-service"."IDX_ea52d8a2faad81796097568a41"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_439c3da422d6de1916e4e4e815"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" RENAME COLUMN "fspId" TO "programFspConfigurationId"`,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_fsp_configuration_property" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "value" character varying NOT NULL, "programFspConfigurationId" integer NOT NULL, CONSTRAINT "programFspConfigurationPropertyUnique" UNIQUE ("programFspConfigurationId", "name"), CONSTRAINT "PK_a71b424e4ed2168ecb5cda93dd6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4b9a24d5c15e92e661112633fd" ON "121-service"."program_fsp_configuration_property" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."payment" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programId" integer NOT NULL, CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c41c74d4a96568569c71cffe88" ON "121-service"."payment" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."registration_attribute_data" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "registrationId" integer NOT NULL, "programRegistrationAttributeId" integer NOT NULL, "value" character varying NOT NULL, CONSTRAINT "registrationProgramAttributeUnique" UNIQUE ("registrationId", "programRegistrationAttributeId"), CONSTRAINT "PK_bef7662581d64d69db3f6405411" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_29cd6ac9bf4002df266d0ba23e" ON "121-service"."registration_attribute_data" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8914b71c0e30c44291ab68a9b8" ON "121-service"."registration_attribute_data" ("registrationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3037018a626cd41bd16c588170" ON "121-service"."registration_attribute_data" ("value") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_registration_attribute" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "label" json NOT NULL, "type" character varying NOT NULL, "isRequired" boolean NOT NULL, "placeholder" json, "options" json, "scoring" json NOT NULL DEFAULT '{}', "programId" integer NOT NULL, "includeInTransactionExport" boolean NOT NULL DEFAULT false, "pattern" character varying, "duplicateCheck" boolean NOT NULL DEFAULT false, "showInPeopleAffectedTable" boolean NOT NULL DEFAULT false, "editableInPortal" boolean NOT NULL DEFAULT false, CONSTRAINT "programAttributeUnique" UNIQUE ("name", "programId"), CONSTRAINT "CHK_c228a4df10e774f22e14834d35" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'fsp', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'registeredDate', 'validationDate', 'inclusionDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType', 'declinedDate')), CONSTRAINT "PK_b85642d2f95cc2fcc6145e14463" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1387f030d9f04f7d80c78a60d5" ON "121-service"."program_registration_attribute" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_attachment" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programId" integer NOT NULL, "userId" integer NOT NULL, "filename" character varying NOT NULL, "mimetype" character varying NOT NULL, "blobName" character varying NOT NULL, CONSTRAINT "PK_2f85b77e3fa056980e2999f2a89" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_42cca4c665cd14fc597e7a5227" ON "121-service"."program_attachment" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."intersolve_visa_child_wallet" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "intersolveVisaParentWalletId" integer NOT NULL, "tokenCode" character varying NOT NULL, "isLinkedToParentWallet" boolean NOT NULL DEFAULT false, "isTokenBlocked" boolean NOT NULL DEFAULT false, "isDebitCardCreated" boolean NOT NULL DEFAULT false, "walletStatus" character varying NOT NULL, "cardStatus" character varying, "lastExternalUpdate" TIMESTAMP, CONSTRAINT "UQ_8d14f1ebd6bb4e145692e264c81" UNIQUE ("tokenCode"), CONSTRAINT "PK_4dc8497d497c3f616b95b81bf4a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4612504fc9c5f58e9af93fbb49" ON "121-service"."intersolve_visa_child_wallet" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_59ddd28d67a179d138682da697" ON "121-service"."intersolve_visa_child_wallet" ("intersolveVisaParentWalletId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8d14f1ebd6bb4e145692e264c8" ON "121-service"."intersolve_visa_child_wallet" ("tokenCode") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."intersolve_visa_parent_wallet" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "intersolveVisaCustomerId" integer NOT NULL, "tokenCode" character varying NOT NULL, "isLinkedToVisaCustomer" boolean NOT NULL DEFAULT false, "balance" integer NOT NULL DEFAULT '0', "lastExternalUpdate" TIMESTAMP, "spentThisMonth" integer NOT NULL DEFAULT '0', "lastUsedDate" date, CONSTRAINT "UQ_9ac897d2fd3f7956e20afbe010a" UNIQUE ("tokenCode"), CONSTRAINT "REL_2975915495fd7289eaad6f4705" UNIQUE ("intersolveVisaCustomerId"), CONSTRAINT "PK_d13a985f2c42065b197689a17e5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0829cb1ad9465f0fae9cd408b1" ON "121-service"."intersolve_visa_parent_wallet" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9ac897d2fd3f7956e20afbe010" ON "121-service"."intersolve_visa_parent_wallet" ("tokenCode") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."registration_event_attribute" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "eventId" integer NOT NULL, "key" character varying NOT NULL, "value" character varying, CONSTRAINT "PK_07d33a76681cb9ac87d25ede395" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_437744e5c3fbb1a8ced09d3280" ON "121-service"."registration_event_attribute" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_92417754d91c93030e21bf1e56" ON "121-service"."registration_event_attribute" ("key") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."registration_event" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "type" character varying NOT NULL, "registrationId" integer NOT NULL, CONSTRAINT "PK_e273290b4292fe15ea3b0d03511" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d26769b88ceaf61d06fe7b6124" ON "121-service"."registration_event" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_289b5cc5aa97009f16f5a426df" ON "121-service"."registration_event" ("type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."unique_registration_pair" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "smallerRegistrationId" integer NOT NULL, "largerRegistrationId" integer NOT NULL, CONSTRAINT "UQ_6aff64d19222185001b8b8def28" UNIQUE ("smallerRegistrationId", "largerRegistrationId"), CONSTRAINT "PK_e5d30a848d61359526995e14f04" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a28498adc19a80fe235901d5a2" ON "121-service"."unique_registration_pair" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fdeb31dd244d876c2aee17e18a" ON "121-service"."unique_registration_pair" ("smallerRegistrationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1e73009dc240dbf7bd71ed86c0" ON "121-service"."unique_registration_pair" ("largerRegistrationId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."organization" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "displayName" json NOT NULL, CONSTRAINT "PK_472c1f99a32def1b0abb219cd67" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_250b754e2e003ae16d59f39b78" ON "121-service"."organization" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."payment_event" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "type" character varying NOT NULL, "paymentId" integer NOT NULL, CONSTRAINT "PK_7e4a9d66fdf160a9fb9d236150f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f8f8fabc6fa41ba8e24b6bf765" ON "121-service"."payment_event" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3422e6387636e8a9e3dea71f55" ON "121-service"."payment_event" ("type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."payment_event_attribute" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "eventId" integer NOT NULL, "key" character varying NOT NULL, "value" character varying, CONSTRAINT "PK_51de998993f371fc3775c58d02a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_91641947e58663bff120b5f2db" ON "121-service"."payment_event_attribute" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6601246e05ca01ad37469aa4d7" ON "121-service"."payment_event_attribute" ("key") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."cbe_transfer" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "debitTheirRef" character varying NOT NULL, "transactionId" integer NOT NULL, CONSTRAINT "REL_8d179b2bec6e57c9215780e7aa" UNIQUE ("transactionId"), CONSTRAINT "PK_4576ac3800975db32bae7cb6723" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e58523e28990976920f9a4c34b" ON "121-service"."cbe_transfer" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."onafriq_transaction" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "thirdPartyTransId" character varying NOT NULL, "mfsTransId" character varying, "recipientMsisdn" character varying NOT NULL, "transactionId" integer NOT NULL, CONSTRAINT "UQ_ad26abef457d617ce1a53108b0d" UNIQUE ("thirdPartyTransId"), CONSTRAINT "REL_1ef2718a1b73906b2af259cfa3" UNIQUE ("transactionId"), CONSTRAINT "PK_634787990e343084f1105420e9c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_04b44b9abd570538d2b4958ee4" ON "121-service"."onafriq_transaction" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."safaricom_transfer" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "originatorConversationId" character varying NOT NULL, "mpesaConversationId" character varying, "mpesaTransactionId" character varying, "transactionId" integer NOT NULL, CONSTRAINT "UQ_995cb444541e19201d105909d82" UNIQUE ("originatorConversationId"), CONSTRAINT "REL_71eecfc6a9376e289b2a52cdf5" UNIQUE ("transactionId"), CONSTRAINT "PK_790f84d691065add5fd8bc8a3ee" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b33c0bf1d6306f931afec51522" ON "121-service"."safaricom_transfer" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."nedbank_voucher" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "orderCreateReference" character varying NOT NULL, "status" character varying, "paymentReference" character varying NOT NULL, "transactionId" integer NOT NULL, CONSTRAINT "UQ_3a31e9cd76bd9c06826c016c130" UNIQUE ("orderCreateReference"), CONSTRAINT "REL_739b726eaa8f29ede851906edd" UNIQUE ("transactionId"), CONSTRAINT "PK_85d56d9ed997ba24b53b3aa36e7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0db7adee73f8cc5c9d44a77e7b" ON "121-service"."nedbank_voucher" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3a31e9cd76bd9c06826c016c13" ON "121-service"."nedbank_voucher" ("orderCreateReference") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" DROP COLUMN "isWhatsappTemplate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" DROP COLUMN "fspId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" DROP COLUMN "value"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "payment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "programId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "financialServiceProviderId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" DROP COLUMN "payment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "phase"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "phoneNumberPlaceholder"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "titlePaApp"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "deprecatedCustomDataKeys"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "evaluationDashboardUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" DROP COLUMN "payment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ADD "contentSid" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ADD "fspName" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ADD "label" json NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "paymentId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "programFspConfigurationId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ADD "paymentId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_role" ADD "description" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user" ADD "isOrganizationAdmin" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user" ADD "displayName" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD "userId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" ADD "userId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" ADD "paymentId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" ADD "userId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ALTER COLUMN "message" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ALTER COLUMN "registrationId" SET NOT NULL`,
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
      `ALTER TABLE "121-service"."latest_message" ALTER COLUMN "messageId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" ALTER COLUMN "holderId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" ALTER COLUMN "registrationId" SET NOT NULL`,
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
      `CREATE INDEX "IDX_26ba3b75368b99964d6dea5cc2" ON "121-service"."transaction" ("paymentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fff8ff586a03d469256098b8f8" ON "121-service"."transaction" ("programFspConfigurationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_af58c0aee423580ac447ab5eff" ON "121-service"."latest_transaction" ("paymentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c67b949a993d791ba90557fa7b" ON "121-service"."intersolve_voucher" ("paymentId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "registrationPaymentLatestTransactionUnique" UNIQUE ("registrationId", "paymentId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ADD CONSTRAINT "FK_55ebe1d2e603be11a0cfc97372f" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" ADD CONSTRAINT "FK_23260bdde9cee10304192140b77" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ADD CONSTRAINT "FK_6be88e8576970978a911084534e" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_26ba3b75368b99964d6dea5cc2c" FOREIGN KEY ("paymentId") REFERENCES "121-service"."payment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_fff8ff586a03d469256098b8f86" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_3a2576be389f520bece9d7dbb98" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "FK_af58c0aee423580ac447ab5eff3" FOREIGN KEY ("paymentId") REFERENCES "121-service"."payment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "FK_a218fd8d386666984192f306367" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "FK_10994d027e2fbaf4ff8e8bf5f45" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment" ADD CONSTRAINT "FK_0f8f281d1010c17f17ff240328a" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" ADD CONSTRAINT "FK_b60be4bf492f3ee8745dfee8806" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" ADD CONSTRAINT "FK_1315d078dc3df552bba424c032b" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_attribute_data" ADD CONSTRAINT "FK_8914b71c0e30c44291ab68a9b8a" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_attribute_data" ADD CONSTRAINT "FK_3bd62b57d06901bcd85e28fd060" FOREIGN KEY ("programRegistrationAttributeId") REFERENCES "121-service"."program_registration_attribute"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ADD CONSTRAINT "FK_8788ebf12909c03049a0d8c377d" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_attachment" ADD CONSTRAINT "FK_28fad6e9cfc39949b09a84437ea" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_attachment" ADD CONSTRAINT "FK_bed7ec4e8c775261cb9960b700f" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."action" ADD CONSTRAINT "FK_20a407367336fd4352de7f8138f" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."note" ADD CONSTRAINT "FK_a341b2f46655af6d3d8356f2b4f" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "FK_9de58ca3e7c32731a9f6aa3d02f" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "FK_cd56d3267e8553557ec97c6741b" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "FK_9c1038f92cd1b99b1babcc4fecf" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "121-service"."whatsapp_pending_message" ADD CONSTRAINT "FK_c4e5540ec65a668f0c155df88e9" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "121-service"."intersolve_voucher" ADD CONSTRAINT "FK_c67b949a993d791ba90557fa7be" FOREIGN KEY ("paymentId") REFERENCES "121-service"."payment"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" ADD CONSTRAINT "FK_7eff6d2d8b784b4ff880d925adc" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_c5eb02b5f6a4b4269d0a19b49f2" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_event_attribute" ADD CONSTRAINT "FK_8b3f63ab7e5d143a31caf18cbd8" FOREIGN KEY ("eventId") REFERENCES "121-service"."registration_event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_event" ADD CONSTRAINT "FK_5d4a07c68647c106a4c3835e060" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_event" ADD CONSTRAINT "FK_ba196730ca0ca8fba27a9e600a1" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."unique_registration_pair" ADD CONSTRAINT "FK_fdeb31dd244d876c2aee17e18ab" FOREIGN KEY ("smallerRegistrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."unique_registration_pair" ADD CONSTRAINT "FK_1e73009dc240dbf7bd71ed86c01" FOREIGN KEY ("largerRegistrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."try_whatsapp" ADD CONSTRAINT "FK_f9302bf2f79e322f0e35357e80a" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_event" ADD CONSTRAINT "FK_62a0ee83009b219a9dd2fe3ec78" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_event" ADD CONSTRAINT "FK_f602a2c38d32fc188d889087adc" FOREIGN KEY ("paymentId") REFERENCES "121-service"."payment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_event_attribute" ADD CONSTRAINT "FK_e28d79f5ba52342f108cc7cb499" FOREIGN KEY ("eventId") REFERENCES "121-service"."payment_event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."cbe_transfer" ADD CONSTRAINT "FK_8d179b2bec6e57c9215780e7aad" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial_bank_ethiopia_account_enquiries" ADD CONSTRAINT "FK_91a620467ab21f97439b6d6b90a" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher_instruction" ADD CONSTRAINT "FK_a4b70f5b341879f17bd410e8d52" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."onafriq_transaction" ADD CONSTRAINT "FK_1ef2718a1b73906b2af259cfa30" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_transfer" ADD CONSTRAINT "FK_71eecfc6a9376e289b2a52cdf55" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."nedbank_voucher" ADD CONSTRAINT "FK_739b726eaa8f29ede851906edd3" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "created", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFspConfigurationLabel", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", fspconfig."name" AS "programFspConfigurationName", fspconfig."id" AS "programFspConfigurationId", fspconfig."fspName" AS "fspName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus", 
        (CASE
            WHEN dup."registrationId" IS NOT NULL THEN 'duplicate'
        ELSE 'unique'
        END)
         AS "duplicateStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFspConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId"  LEFT JOIN (SELECT distinct d1."registrationId" FROM "121-service"."registration_attribute_data" "d1" INNER JOIN "121-service"."registration_attribute_data" "d2" ON d1."programRegistrationAttributeId" = d2."programRegistrationAttributeId" AND "d1"."value" = "d2"."value" AND d1."registrationId" != d2."registrationId"  INNER JOIN "121-service"."registration" "registration1" ON d1."registrationId" = "registration1"."id" AND registration1."registrationStatus" != 'declined'  INNER JOIN "121-service"."registration" "registration2" ON d2."registrationId" = "registration2"."id" AND registration2."registrationStatus" != 'declined'  INNER JOIN "121-service"."program_registration_attribute" "pra" ON d1."programRegistrationAttributeId" = "pra"."id" WHERE "d1"."value" != '' AND pra."duplicateCheck" = true AND 
              NOT EXISTS (
                SELECT 1
                FROM "121-service".unique_registration_pair rup
                WHERE rup."smallerRegistrationId" = LEAST(d1."registrationId", d2."registrationId")
                  AND rup."largerRegistrationId" = GREATEST(d1."registrationId", d2."registrationId")
              )) "dup" ON "registration"."id" = dup."registrationId" ORDER BY "registration"."registrationProgramId" ASC`);
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_view',
        'SELECT "registration"."id" AS "id", "registration"."created" AS "created", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFspConfigurationLabel", CAST(CONCAT(\'PA #\',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", fspconfig."name" AS "programFspConfigurationName", fspconfig."id" AS "programFspConfigurationId", fspconfig."fspName" AS "fspName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || \': \' || "message"."status",\'no messages yet\') AS "lastMessageStatus", \n        (CASE\n            WHEN dup."registrationId" IS NOT NULL THEN \'duplicate\'\n        ELSE \'unique\'\n        END)\n         AS "duplicateStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFspConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId"  LEFT JOIN (SELECT distinct d1."registrationId" FROM "121-service"."registration_attribute_data" "d1" INNER JOIN "121-service"."registration_attribute_data" "d2" ON d1."programRegistrationAttributeId" = d2."programRegistrationAttributeId" AND "d1"."value" = "d2"."value" AND d1."registrationId" != d2."registrationId"  INNER JOIN "121-service"."registration" "registration1" ON d1."registrationId" = "registration1"."id" AND registration1."registrationStatus" != \'declined\'  INNER JOIN "121-service"."registration" "registration2" ON d2."registrationId" = "registration2"."id" AND registration2."registrationStatus" != \'declined\'  INNER JOIN "121-service"."program_registration_attribute" "pra" ON d1."programRegistrationAttributeId" = "pra"."id" WHERE "d1"."value" != \'\' AND pra."duplicateCheck" = true AND \n              NOT EXISTS (\n                SELECT 1\n                FROM "121-service".unique_registration_pair rup\n                WHERE rup."smallerRegistrationId" = LEAST(d1."registrationId", d2."registrationId")\n                  AND rup."largerRegistrationId" = GREATEST(d1."registrationId", d2."registrationId")\n              )) "dup" ON "registration"."id" = dup."registrationId" ORDER BY "registration"."registrationProgramId" ASC',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    await queryRunner.query(
      `ALTER TABLE "121-service"."nedbank_voucher" DROP CONSTRAINT "FK_739b726eaa8f29ede851906edd3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."safaricom_transfer" DROP CONSTRAINT "FK_71eecfc6a9376e289b2a52cdf55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."onafriq_transaction" DROP CONSTRAINT "FK_1ef2718a1b73906b2af259cfa30"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher_instruction" DROP CONSTRAINT "FK_a4b70f5b341879f17bd410e8d52"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial_bank_ethiopia_account_enquiries" DROP CONSTRAINT "FK_91a620467ab21f97439b6d6b90a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."cbe_transfer" DROP CONSTRAINT "FK_8d179b2bec6e57c9215780e7aad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_event_attribute" DROP CONSTRAINT "FK_e28d79f5ba52342f108cc7cb499"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_event" DROP CONSTRAINT "FK_f602a2c38d32fc188d889087adc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_event" DROP CONSTRAINT "FK_62a0ee83009b219a9dd2fe3ec78"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."try_whatsapp" DROP CONSTRAINT "FK_f9302bf2f79e322f0e35357e80a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."unique_registration_pair" DROP CONSTRAINT "FK_1e73009dc240dbf7bd71ed86c01"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."unique_registration_pair" DROP CONSTRAINT "FK_fdeb31dd244d876c2aee17e18ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_event" DROP CONSTRAINT "FK_ba196730ca0ca8fba27a9e600a1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_event" DROP CONSTRAINT "FK_5d4a07c68647c106a4c3835e060"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_event_attribute" DROP CONSTRAINT "FK_8b3f63ab7e5d143a31caf18cbd8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_c5eb02b5f6a4b4269d0a19b49f2"`,
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
      `ALTER TABLE "121-service"."intersolve_voucher" DROP CONSTRAINT "FK_7eff6d2d8b784b4ff880d925adc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" DROP CONSTRAINT "FK_c67b949a993d791ba90557fa7be"`,
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
      `ALTER TABLE "121-service"."whatsapp_pending_message" DROP CONSTRAINT "FK_c4e5540ec65a668f0c155df88e9"`,
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
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "FK_9c1038f92cd1b99b1babcc4fecf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "FK_cd56d3267e8553557ec97c6741b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "FK_9de58ca3e7c32731a9f6aa3d02f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."note" DROP CONSTRAINT "FK_a341b2f46655af6d3d8356f2b4f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."action" DROP CONSTRAINT "FK_20a407367336fd4352de7f8138f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_attachment" DROP CONSTRAINT "FK_bed7ec4e8c775261cb9960b700f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_attachment" DROP CONSTRAINT "FK_28fad6e9cfc39949b09a84437ea"`,
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
      `ALTER TABLE "121-service"."program_aidworker_assignment" DROP CONSTRAINT "FK_1315d078dc3df552bba424c032b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" DROP CONSTRAINT "FK_b60be4bf492f3ee8745dfee8806"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment" DROP CONSTRAINT "FK_0f8f281d1010c17f17ff240328a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT "FK_10994d027e2fbaf4ff8e8bf5f45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT "FK_a218fd8d386666984192f306367"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT "FK_af58c0aee423580ac447ab5eff3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_3a2576be389f520bece9d7dbb98"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_fff8ff586a03d469256098b8f86"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_26ba3b75368b99964d6dea5cc2c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" DROP CONSTRAINT "FK_6be88e8576970978a911084534e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" DROP CONSTRAINT "FK_23260bdde9cee10304192140b77"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" DROP CONSTRAINT "FK_55ebe1d2e603be11a0cfc97372f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT "registrationPaymentLatestTransactionUnique"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_c67b949a993d791ba90557fa7b"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_af58c0aee423580ac447ab5eff"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_fff8ff586a03d469256098b8f8"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_26ba3b75368b99964d6dea5cc2"`,
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
      `ALTER TABLE "121-service"."intersolve_visa_customer" ALTER COLUMN "registrationId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" ALTER COLUMN "holderId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_message" ALTER COLUMN "messageId" DROP NOT NULL`,
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
      `ALTER TABLE "121-service"."transaction" ALTER COLUMN "registrationId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ALTER COLUMN "message" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" DROP COLUMN "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" DROP COLUMN "paymentId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" DROP COLUMN "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP COLUMN "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user" DROP COLUMN "displayName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user" DROP COLUMN "isOrganizationAdmin"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_role" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" DROP COLUMN "paymentId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "programFspConfigurationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "paymentId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" DROP COLUMN "label"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" DROP COLUMN "fspName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" DROP COLUMN "contentSid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" ADD "payment" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "evaluationDashboardUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "deprecatedCustomDataKeys" json NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "titlePaApp" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "phoneNumberPlaceholder" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "phase" character varying NOT NULL DEFAULT 'design'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ADD "payment" integer NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "financialServiceProviderId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "programId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "payment" integer NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ADD "value" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ADD "fspId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ADD "isWhatsappTemplate" boolean NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_3a31e9cd76bd9c06826c016c13"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_0db7adee73f8cc5c9d44a77e7b"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."nedbank_voucher"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_b33c0bf1d6306f931afec51522"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."safaricom_transfer"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_04b44b9abd570538d2b4958ee4"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."onafriq_transaction"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_e58523e28990976920f9a4c34b"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."cbe_transfer"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_6601246e05ca01ad37469aa4d7"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_91641947e58663bff120b5f2db"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."payment_event_attribute"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_3422e6387636e8a9e3dea71f55"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_f8f8fabc6fa41ba8e24b6bf765"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."payment_event"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_250b754e2e003ae16d59f39b78"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."organization"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_1e73009dc240dbf7bd71ed86c0"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_fdeb31dd244d876c2aee17e18a"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_a28498adc19a80fe235901d5a2"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."unique_registration_pair"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_289b5cc5aa97009f16f5a426df"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_d26769b88ceaf61d06fe7b6124"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."registration_event"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_92417754d91c93030e21bf1e56"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_437744e5c3fbb1a8ced09d3280"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."registration_event_attribute"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_9ac897d2fd3f7956e20afbe010"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_0829cb1ad9465f0fae9cd408b1"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."intersolve_visa_parent_wallet"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_8d14f1ebd6bb4e145692e264c8"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_59ddd28d67a179d138682da697"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_4612504fc9c5f58e9af93fbb49"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."intersolve_visa_child_wallet"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_42cca4c665cd14fc597e7a5227"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."program_attachment"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_1387f030d9f04f7d80c78a60d5"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."program_registration_attribute"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_3037018a626cd41bd16c588170"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_8914b71c0e30c44291ab68a9b8"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_29cd6ac9bf4002df266d0ba23e"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."registration_attribute_data"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_c41c74d4a96568569c71cffe88"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."payment"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_4b9a24d5c15e92e661112633fd"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."program_fsp_configuration_property"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" RENAME COLUMN "programFspConfigurationId" TO "fspId"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_439c3da422d6de1916e4e4e815" ON "121-service"."latest_transaction" ("payment") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ea52d8a2faad81796097568a41" ON "121-service"."transaction" ("payment") `,
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
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_5423104a960c57439e028eb57c5" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345" FOREIGN KEY ("fspId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "121-service"."note" ADD CONSTRAINT "FK_a341b2f46655af6d3d8356f2b4f" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "FK_a218fd8d386666984192f306367" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "FK_10994d027e2fbaf4ff8e8bf5f45" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_d3c35664dbb056d04694819316e" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_3a2576be389f520bece9d7dbb98" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_ba98ea5ca43ebe54f60c5aaabec" FOREIGN KEY ("financialServiceProviderId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ADD CONSTRAINT "FK_6be88e8576970978a911084534e" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ADD CONSTRAINT "FK_16ea24d04150003a29a346ade61" FOREIGN KEY ("fspId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ADD CONSTRAINT "FK_55ebe1d2e603be11a0cfc97372f" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fsp"."fsp" AS "financialServiceProvider", "fsp"."displayName" AS "fspDisplayName", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",'yyyy-mm-dd') AS "registrationCreatedDate", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."financial_service_provider" "fsp" ON "fsp"."id"="registration"."fspId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_view',
        'SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fsp"."fsp" AS "financialServiceProvider", "fsp"."displayName" AS "fspDisplayName", CAST(CONCAT(\'PA #\',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",\'yyyy-mm-dd\') AS "registrationCreatedDate", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || \': \' || "message"."status",\'no messages yet\') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."financial_service_provider" "fsp" ON "fsp"."id"="registration"."fspId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC',
      ],
    );
  }
}
