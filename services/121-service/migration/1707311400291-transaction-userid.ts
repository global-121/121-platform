import { MigrationInterface, QueryRunner } from 'typeorm';

export class TransactionUserid1707311400291 implements MigrationInterface {
  name = 'TransactionUserid1707311400291';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "userId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."action" DROP CONSTRAINT "FK_b2e3f7568dafa9e86ae03910111"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."action" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."action" ADD CONSTRAINT "FK_b2e3f7568dafa9e86ae03910111" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_605baeb040ff0fae995404cea37" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    // Select user with lowest id where admin = true
    const adminUser = await queryRunner.query(
      `SELECT * FROM "121-service"."user" WHERE admin = true ORDER BY id LIMIT 1`,
    );
    // Update all transactions with the user id
    await queryRunner.query(
      `UPDATE "121-service"."transaction" SET "userId" = ${adminUser[0].id}`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_605baeb040ff0fae995404cea37"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."action" DROP CONSTRAINT "FK_b2e3f7568dafa9e86ae03910111"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."action" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."action" ADD CONSTRAINT "FK_b2e3f7568dafa9e86ae03910111" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "userId"`,
    );
  }
}
