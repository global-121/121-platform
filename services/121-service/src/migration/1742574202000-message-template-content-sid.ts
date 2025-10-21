import { MigrationInterface, QueryRunner } from 'typeorm';

import { env } from '@121-service/src/env';

export class MessageTemplateContentSid1742574202000
  implements MigrationInterface
{
  name = 'MessageTemplateContentSid1742574202000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const currentMessageTemplates = await queryRunner.query(
      `SELECT * FROM "121-service"."message_template" where "isWhatsappTemplate" = true and  "programId" in (2,3) and type in ('whatsappGenericMessage', 'whatsappPayment')`,
    ); // Other message templates are not included as these are all sent as replies

    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" DROP COLUMN "isWhatsappTemplate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ADD "contentSid" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ALTER COLUMN "message" DROP NOT NULL`,
    );

    // Migrate NLRC
    // Commented out as this migration is not needed for NLRC anymore and it was
    // giving TS issues with newer versions of the twilio client.
    // if (env.ENV_NAME === 'NLRC') {
    //   const contents = await twilioClient.content.v1.contentAndApprovals.list();
    //   // filter out content no quick reply and non approved
    //   const filteredContents = contents.filter(
    //     (content) =>
    //       content.(types as any)['twilio/quick-reply'] &&
    //       content.(types as any)['twilio/quick-reply']?.body &&
    //       content.approvalRequests.status === 'approved',
    //   );

    //   // Find the contentSid for each message template
    //   for (const messageTemplate of currentMessageTemplates) {
    //     let sid: undefined | string = undefined;
    //     for (const content of filteredContents) {
    //       if (
    //         content.(types as any)['twilio/quick-reply']?.body ===
    //         messageTemplate.message
    //       ) {
    //         sid = content.sid;
    //         await queryRunner.query(
    //           `UPDATE "121-service"."message_template" SET "contentSid" = '${sid}' WHERE "id" = ${messageTemplate.id}`,
    //         );
    //         break;
    //       }
    //     }
    //     if (!sid) {
    //       throw new Error(
    //         `Migration failed: Content not found for message template ${messageTemplate.id}`,
    //       );
    //     }
    //   }

    //   // log all message templates with contentSid
    //   const messageTemplates = await queryRunner.query(
    //     `SELECT * FROM "121-service"."message_template" where "contentSid" is not null`,
    //   );
    //   console.table(
    //     messageTemplates.map((messageTemplate: any) => ({
    //       id: messageTemplate.id,
    //       contentSid: messageTemplate.contentSid,
    //       message: messageTemplate.message,
    //     })),
    //   );
    // }

    // Migrate instance that are in mock mode: important for demo and training
    // This will set the contentSid to a mock value related to the language and type
    // It does not take into account the mock message we have for PV and OCW, it seemed not worth the effort
    if (env.MOCK_TWILIO) {
      for (const messageTemplate of currentMessageTemplates) {
        const language = messageTemplate.language;
        const type =
          messageTemplate.type === 'whatsappGenericMessage'
            ? 'Generic'
            : 'Payment';
        const mockContentSidKey = `${language}${type}`;

        // insert mock contentSid and set message to null
        await queryRunner.query(
          `UPDATE "121-service"."message_template" SET "contentSid" = '${mockContentSidKey}' WHERE "id" = ${messageTemplate.id}`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ALTER COLUMN "message" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" DROP COLUMN "contentSid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ADD "isWhatsappTemplate" boolean NOT NULL`,
    );
  }
}
