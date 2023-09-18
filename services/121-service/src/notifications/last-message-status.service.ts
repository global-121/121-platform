import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { MessageStatusMapping } from '../registration/enum/last-message-status';
import { RegistrationEntity } from '../registration/registration.entity';
import { TwilioMessageEntity } from './twilio.entity';

@Injectable()
export class LastMessageStatusService {
  constructor(
    @InjectRepository(RegistrationEntity)
    private readonly registrationRepository: Repository<RegistrationEntity>,
  ) {}

  public async updateLastMessageStatus(messageSid: string): Promise<void> {
    let query = this.registrationRepository
      .createQueryBuilder('registration')
      .leftJoin('registration.twilioMessages', 'twilioMessagesSelect')
      .select('"registration"."id"')
      .where('"twilioMessagesSelect".sid = :messageSid', {
        messageSid: messageSid,
      });
    query = this.includeLastMessage(query);
    const updateData = await query.getRawOne();

    if (updateData.lastMessageStatus) {
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

  private includeLastMessage(
    q: SelectQueryBuilder<RegistrationEntity>,
  ): SelectQueryBuilder<RegistrationEntity> {
    q.leftJoin(
      (qb) =>
        qb
          .from(TwilioMessageEntity, 'messages')
          .select('MAX("created")', 'created')
          .addSelect('"registrationId"', 'registrationId')
          .groupBy('"registrationId"'),
      'messages_max_created',
      'messages_max_created."registrationId" = registration.id',
    )
      .leftJoin(
        'registration.twilioMessages',
        'twilioMessages',
        `twilioMessages.created = messages_max_created.created`,
      )
      .addSelect([
        '"twilioMessages"."status" AS "lastMessageStatus"',
        '"twilioMessages"."type" AS "lastMessageType"',
      ]);
    return q;
  }
}
