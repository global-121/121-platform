import { In, MigrationInterface, QueryRunner } from 'typeorm';
import { MessageTemplateEntity } from '../src/notifications/message-template/message-template.entity';
import { ProgramEntity } from '../src/programs/program.entity';

export class CreateAndUpdateMessageTemplates1701426130489
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

    // Update existing templates
    const templates = await messageTemplateRepository.find();
    for await (const template of templates) {
      if (template.message.includes('{{1}}')) {
        template.message = template.message.replace('{{1}}', '[[amount]]');
        await messageTemplateRepository.save(template);
      }
    }

    // Add new status-change templates
    // TODO: copy in here the latest templates including all translations
    // use the same templates for LVV and PV
    const programRepository = manager.getRepository(ProgramEntity);
    const relevantPrograms = await programRepository.find({
      where: { ngo: 'NLRC', id: In([1, 2]) },
    });
    const newTemplates = {
      invited: {
        isWhatsappTemplate: false,
        message: {
          en: 'This is a message from the Red Cross. {{namePartnerOrganization}} has passed on your telephone number to us.\n\nWe can help you with weekly Albert Heijn vouchers. Click on the link and complete the application:\n\nhttps://register.nlrc.121.global/?programs=2\n\nYou need an internet connection to open the link.\n\nDo you have questions? Send us a message via WhatsApp:\n\nhttps://wa.me/31614458781\n\nor contact {{namePartnerOrganization}}.',
        },
      },
      included: {
        isWhatsappTemplate: false,
        message: {
          en: 'This is a message from the Red Cross.\n\nThanks for registering. From now on you will receive an Albert Heijn voucher via WhatsApp every Tuesday. You will receive the vouchers as long as you are on the list of {{namePartnerOrganization}}.\n\nThe Red Cross can also provide you with information about, for example, medical assistance, food or safety. Check out our website:\n\nhttps://helpfulinformation.redcross.nl/\n\nor ask your question via WhatsApp:\n\nhttps://wa.me/31614458781',
        },
      },
      inclusionEnded: {
        isWhatsappTemplate: false,
        message: {
          en: 'This is a message from the Red Cross.\n\nThis week you received your last voucher because you are no longer on the list of {{namePartnerOrganization}}.\n\nDo you have questions about this? Send us a message via WhatsApp:\n\nhttps://wa.me/31614458781\n\nor contact {{namePartnerOrganization}}.\n\nWe wish you all the best.',
        },
      },
      rejected: {
        isWhatsappTemplate: false,
        message: {
          en: 'This is a message from the Red Cross.\n\nUnfortunately, we have to reject your request for Albert Heijn vouchers. You have not been signed up for this help by one of our partner organizations.\n\nDo you have questions about this? Please contact us via WhatsApp:\n\nhttps://wa.me/31614458781',
        },
      },
    };

    for (const program of relevantPrograms) {
      for (const type of Object.keys(newTemplates)) {
        for (const language of Object.keys(newTemplates[type].message)) {
          const template = {
            type,
            language,
            isWhatsappTemplate: newTemplates[type].isWhatsappTemplate,
            message: newTemplates[type].message[language],
            programId: program.id,
          };
          await messageTemplateRepository.save(template);
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
