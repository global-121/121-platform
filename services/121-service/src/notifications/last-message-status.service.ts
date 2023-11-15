import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MessageStatusMapping } from '../registration/enum/last-message-status';
import { RegistrationEntity } from '../registration/registration.entity';
import { TwilioMessageEntity } from './twilio.entity';

@Injectable()
export class LastMessageStatusService {
  constructor(
    @InjectRepository(RegistrationEntity)
    private readonly registrationRepository: Repository<RegistrationEntity>,
    @InjectRepository(TwilioMessageEntity)
    private readonly twilioMessageRepository: Repository<TwilioMessageEntity>,
    private readonly dataSource: DataSource,
  ) {}

  public async updateLastMessageStatusBulk(): Promise<void> {
    await this.dataSource.query(`UPDATE
              "121-service"."registration"
            SET
              "lastMessageStatus" = ("updateData"."lastMessageType" || ': ' || "updateData"."lastMessageStatus")
            FROM
              (
              SELECT
                *
              FROM
                (
                SELECT
                  DISTINCT ON
                  (registration.id) registration.id AS id,
                  twilio_message."status" AS "lastMessageStatus",
                  twilio_message."type" AS "lastMessageType"
                FROM
                "121-service".registration
                LEFT JOIN "121-service".twilio_message
            ON
                  twilio_message."registrationId" = registration.id
                ORDER BY
                  registration.id,
                  twilio_message.created DESC
              ) latestmessage
              WHERE
                latestmessage."lastMessageStatus" IS NOT NULL
            ) "updateData"
            WHERE
              "registration"."id" = "updateData"."id";
            `);
  }

  public async updateLastMessageStatus(messageSid: string): Promise<void> {
    const getRegistrationByMessageSidQuery = this.twilioMessageRepository
      .createQueryBuilder('messages')
      .select('"registrationId"')
      .where('sid = :sid', { sid: messageSid })
      .limit(1);

    const getLatestMessageQuery = this.registrationRepository
      .createQueryBuilder('registration')
      .leftJoin('registration.twilioMessages', 'twilioMessages')
      .distinctOn(['registration.id'])
      .select([
        '"registration"."id" AS "id"',
        '"twilioMessages"."status" AS "lastMessageStatus"',
        '"twilioMessages"."type" AS "lastMessageType"',
      ])
      .where(
        `"registrationId" = (${getRegistrationByMessageSidQuery.getQuery()})`,
      )
      .setParameters(getRegistrationByMessageSidQuery.getParameters())
      .orderBy('registration.id')
      .addOrderBy('twilioMessages.created', 'DESC');
    const updateData = await getLatestMessageQuery.getRawOne();

    if (updateData && updateData.lastMessageStatus) {
      const mappedStatus = MessageStatusMapping[updateData.lastMessageStatus];
      const lastMessageStatusInsert = `${updateData.lastMessageType}: ${mappedStatus}`;

      // Update registration last message status
      await this.registrationRepository.update(
        { id: updateData.id },
        {
          lastMessageStatus: lastMessageStatusInsert,
        },
      );
    }
  }
}
