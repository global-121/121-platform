import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentApprovalAndPaymentEventPaymentIdIndex1785753425583
  implements MigrationInterface
{
  name = 'AddPaymentApprovalAndPaymentEventPaymentIdIndex1785753425583';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_489750b2f9e0c35193c674302d" ON "121-service"."payment_approval" ("paymentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f602a2c38d32fc188d889087ad" ON "121-service"."payment_event" ("paymentId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_f602a2c38d32fc188d889087ad"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_489750b2f9e0c35193c674302d"`,
    );
  }
}
