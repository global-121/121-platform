import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexesToSpeedUpPaymentDeletion1785754193436
  implements MigrationInterface
{
  name = 'AddIndexesToSpeedUpPaymentDeletion1785754193436';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_cd56d3267e8553557ec97c6741" ON "121-service"."twilio_message" ("transactionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_489750b2f9e0c35193c674302d" ON "121-service"."payment_approval" ("paymentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f602a2c38d32fc188d889087ad" ON "121-service"."payment_event" ("paymentId") `,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    console.log('what goes up does not always have to come down');
  }
}
