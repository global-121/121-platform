import { MigrationInterface, QueryRunner } from 'typeorm';

export class CooperativeBankAccountValidation1764069631256 implements MigrationInterface {
  name = 'CooperativeBankAccountValidation1764069631256';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."cooperative_bank_of_oromia_account_validation" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "registrationId" integer NOT NULL, "nameUsedForTheMatch" character varying, "bankAccountNumberUsedForCall" character varying, "cooperativeBankOfOromiaName" character varying, "namesMatch" boolean  NOT NULL, "errorMessage" character varying, CONSTRAINT "REL_dc9856fae693685b5ae8c375eb" UNIQUE ("registrationId"), CONSTRAINT "PK_4b7845b7acb5ded35cf40d2e9d1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f320769996c439d7e298f208f5" ON "121-service"."cooperative_bank_of_oromia_account_validation" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."cooperative_bank_of_oromia_account_validation" ADD CONSTRAINT "FK_dc9856fae693685b5ae8c375eb6" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(_q: QueryRunner): Promise<void> {
    console.log('We always go forward!');
  }
}
