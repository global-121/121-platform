import { MigrationInterface, QueryRunner } from 'typeorm';
import { MessageTemplateEntity } from '../src/notifications/message-template/message-template.entity';
import { ProgramEntity } from '../src/programs/program.entity';

export class MessageTemplate1699276319254 implements MigrationInterface {
  name = 'MessageTemplate1699276319254';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."message_template" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "type" character varying NOT NULL, "language" character varying NOT NULL, "message" character varying NOT NULL, "isWhatsappTemplate" boolean NOT NULL, "programId" integer NOT NULL, CONSTRAINT "PK_616800da109c721fb4dd2019a9b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_927cc52d451d253f66fcc9d659" ON "121-service"."message_template" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ADD CONSTRAINT "FK_55ebe1d2e603be11a0cfc97372f" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  private async migrateData(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;
    const whatsAppMessageTemplateNames = [
      'whatsappGenericMessage',
      'whatsappPayment',
    ];
    const programsRepository = manager.getRepository(ProgramEntity);

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
            const messageTemplate = {
              programId: program['id'],
              language: language,
              type: key,
              message: text,
              isWhatsappTemplate: whatsAppMessageTemplateNames.includes(key),
            };
            await queryRunner.query(
              `INSERT INTO "121-service"."message_template"("type", "language", "message", "isWhatsappTemplate", "programId") VALUES ($1, $2, $3, $4, $5)`,
              [
                messageTemplate.type,
                messageTemplate.language,
                messageTemplate.message,
                messageTemplate.isWhatsappTemplate,
                messageTemplate.programId,
              ],
            );
          }
        }
      }
    }

    // Remove notifications column because it is not needed anymore
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "notifications"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD COLUMN IF NOT EXISTS "notifications" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" DROP CONSTRAINT "FK_55ebe1d2e603be11a0cfc97372f"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_927cc52d451d253f66fcc9d659"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."message_template"`);
  }
}
