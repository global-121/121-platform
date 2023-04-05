import { MigrationInterface, QueryRunner } from 'typeorm';

export class IntersolveInstructionPerProgram1680701153376
  implements MigrationInterface
{
  name = 'IntersolveInstructionPerProgram1680701153376';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher_instruction" ADD "programId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher_instruction" ADD CONSTRAINT "FK_a4b70f5b341879f17bd410e8d52" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher_instruction" DROP CONSTRAINT "FK_a4b70f5b341879f17bd410e8d52"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher_instruction" DROP COLUMN "programId"`,
    );
  }
}
