import { MigrationInterface, QueryRunner } from 'typeorm';
import { MessageTemplateEntity } from '../src/notifications/message-template/message-template.entity';

export class MessageTemplates1ToAmount1701426130489
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  private async migrateData(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;

    const messageTemplateRepository = manager.getRepository(
      MessageTemplateEntity,
    );
    const templates = await messageTemplateRepository.find();

    for await (const template of templates) {
      if (template.message.includes('{{1}}')) {
        template.message = template.message.replace('{{1}}', '[[amount]]');
        await messageTemplateRepository.save(template);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
