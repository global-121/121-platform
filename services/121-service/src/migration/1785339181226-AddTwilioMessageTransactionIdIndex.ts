import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTwilioMessageTransactionIdIndex1785339181226 implements Omit<
  MigrationInterface,
  'down'
> {
  name = 'AddTwilioMessageTransactionIdIndex1785339181226';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_cd56d3267e8553557ec97c6741" ON "121-service"."twilio_message" ("transactionId") `,
    );
  }
}
