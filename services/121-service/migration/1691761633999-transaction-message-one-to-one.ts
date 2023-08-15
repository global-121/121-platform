import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { TwilioMessageEntity } from '../src/notifications/twilio.entity';
import { TransactionEntity } from '../src/payments/transactions/transaction.entity';

export class transactionMessageRelation1691761756517
  implements MigrationInterface
{
  name = 'transactionMessageRelation1691761756517';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD "transactionId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "UQ_cd56d3267e8553557ec97c6741b" UNIQUE ("transactionId")`,
    );
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner.manager);
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "UQ_cd56d3267e8553557ec97c6741b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP COLUMN "transactionId"`,
    );
  }

  private async migrateData(manager: EntityManager): Promise<void> {
    const transactionRepository = manager.getRepository(TransactionEntity);
    const messageRepo = manager.getRepository(TwilioMessageEntity);
    const transactions = await transactionRepository.find();
    const messages: TwilioMessageEntity[] = [];
    for (const t of transactions) {
      if (t.customData?.['messageSid']) {
        const message = await messageRepo.findOne({
          where: { sid: t.customData?.['messageSid'] },
        });
        if (message != null) {
          message.transaction = t;
          messages.push(message);
        }
      }
    }
    await messageRepo.save(messages, {
      chunk: 5000,
    });
  }
}
