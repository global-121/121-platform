import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial } from 'typeorm';

import { MessageProcessType } from '@121-service/src/notifications/dto/message-job.dto';
import { TwilioStatus } from '@121-service/src/notifications/dto/twilio.dto';
import {
  NotificationType,
  TwilioMessageEntity,
} from '@121-service/src/notifications/entities/twilio.entity';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { BaseDataFactory } from '@121-service/src/scripts/factories/base-data-factory';

@Injectable()
export class TwilioMessageDataFactory extends BaseDataFactory<TwilioMessageEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, dataSource.getRepository(TwilioMessageEntity));
  }

  /**
   * Duplicate existing messages (replaces mock-messages.sql)
   */
  public async duplicateExistingMessages(): Promise<void> {
    console.log(`Duplicating existing messages`);

    // Get all existing messages
    const existingMessages = await this.repository.find();

    if (existingMessages.length === 0) {
      console.warn('No existing messages found to duplicate');
      return;
    }

    const options = this.getDefaultMessageOptions();

    const newMessagesData: DeepPartial<TwilioMessageEntity>[] =
      existingMessages.map((message) => ({
        accountSid: message.accountSid || options.accountSid || 'ACdefault',
        body: message.body || 'Mock message body',
        mediaUrl: message.mediaUrl,
        to: message.to || '+31600000000',
        from: message.from || options.from || '+31600000001',
        sid: this.generateTwilioSid(), // Generate new unique SID
        status: message.status || TwilioStatus.delivered,
        type: message.type || NotificationType.Sms,
        dateCreated: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random recent date
        registrationId: message.registrationId,
        userId: message.userId || 1,
        processType: message.processType || MessageProcessType.sms,
        contentType: message.contentType || MessageContentType.custom,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
      }));

    await this.createEntitiesBatch(newMessagesData);
  }

  /**
   * Generate 1 message for each registration
   * NOTE: this generates instead of duplicates, so also inserts for the initial registration again. This does not matter here.
   */
  public async generateMessagesForRegistrations(): Promise<
    TwilioMessageEntity[]
  > {
    const registrationRepository =
      this.dataSource.getRepository(RegistrationEntity);
    const registrations = await registrationRepository.find();
    console.log(
      `Generating messages for ${registrations.length} registrations`,
    );

    const options = this.getDefaultMessageOptions();

    const messagesData: DeepPartial<TwilioMessageEntity>[] = registrations.map(
      (registration) => ({
        accountSid: options.accountSid,
        body: this.generateMessageBody(),
        mediaUrl: null,
        to: registration.phoneNumber || this.generatePhoneNumber(),
        from: options.from,
        sid: this.generateTwilioSid(),
        status: options.status || TwilioStatus.delivered,
        type: options.type || NotificationType.Sms,
        dateCreated: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        registrationId: registration.id,
        userId: 1,
        processType: options.processType || MessageProcessType.sms,
        contentType: options.contentType || MessageContentType.custom,
        errorCode: null,
        errorMessage: null,
      }),
    );

    return await this.createEntitiesBatch(messagesData);
  }

  private getDefaultMessageOptions() {
    return {
      accountSid: 'AC_test_account_sid',
      from: '+1234567890',
      status: TwilioStatus.delivered,
      type: NotificationType.Sms,
      processType: MessageProcessType.sms,
      contentType: MessageContentType.custom,
    };
  }

  public async updateLatestMessages(): Promise<void> {
    console.log('Updating latest messages table');

    // Clear existing latest messages
    await this.dataSource.query(
      'TRUNCATE TABLE "121-service"."latest_message"',
    );

    // Insert latest messages using a more efficient query
    await this.dataSource.query(`
      INSERT INTO "121-service"."latest_message" ("registrationId", "messageId")
      SELECT DISTINCT ON ("registrationId")
        "registrationId",
        "id" as "messageId"
      FROM "121-service"."twilio_message"
      WHERE "registrationId" IS NOT NULL
      ORDER BY "registrationId", "created" DESC
    `);

    console.log('Latest messages table updated successfully');
  }

  private generateTwilioSid(): string {
    return `SM${Math.random().toString(36).substring(2, 34)}`;
  }

  private generateMessageBody(): string {
    const messages = [
      'Your payment has been processed successfully.',
      'Thank you for registering with our program.',
      'Your account has been updated.',
      'Payment confirmation: Your transaction is complete.',
      'Welcome to the program. Please check your status.',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
}
