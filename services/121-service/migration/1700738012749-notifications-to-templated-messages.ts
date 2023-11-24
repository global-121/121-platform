import { MigrationInterface, QueryRunner } from 'typeorm';
import { ProgramEntity } from '../src/programs/program.entity';
import { MessageTemplateEntity } from '../src/notifications/message-template/message-template.entity';

export class NotificationsToTemplatedMessages1700738012749
  implements MigrationInterface
{
  name = 'NotificationsToTemplatedMessages1700738012749';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}

  private async migrateData(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;
    const whatsAppMessageTemplateNames = [
      'whatsappGenericMessage',
      'whatsappPayment',
    ];
    const programsRepository = manager.getRepository(ProgramEntity);
    const messageTemplateRepository = manager.getRepository(
      MessageTemplateEntity,
    );
    const programsQb = programsRepository
      .createQueryBuilder('program')
      .select(['id', 'notifications']);
    const programs = await programsQb.getRawMany();

    for (const program of programs) {
      const notifications = program['notifications'];
      if (notifications) {
        for (const [language, messages] of Object.entries<string>(
          notifications,
        )) {
          for (const [key, text] of Object.entries(messages)) {
            const messageTemplate = new MessageTemplateEntity();
            messageTemplate.programId = program['id'];
            messageTemplate.language = language;
            messageTemplate.type = key;
            messageTemplate.message = text;
            messageTemplate.isWhatsappTemplate =
              whatsAppMessageTemplateNames.includes(key);
            await messageTemplateRepository.save(messageTemplate);
          }
        }
      }
    }

    // Remove notifications column because it is not needed anymore
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "notifications"`,
    );
  }
}
