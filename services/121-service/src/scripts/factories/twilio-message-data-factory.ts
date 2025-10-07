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

export interface TwilioMessageFactoryOptions {
  readonly accountSid: string;
  readonly from: string;
  readonly userId?: number;
  readonly status?: TwilioStatus;
  readonly type?: NotificationType;
  readonly processType?: MessageProcessType;
  readonly contentType?: MessageContentType;
}

@Injectable()
export class TwilioMessageDataFactory extends BaseDataFactory<TwilioMessageEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, dataSource.getRepository(TwilioMessageEntity));
  }

  /**
   * Generate mock Twilio messages
   */
  public async generateMockData(
    count: number,
    options: TwilioMessageFactoryOptions,
  ): Promise<TwilioMessageEntity[]> {
    console.log(`Generating ${count} mock Twilio messages`);

    // Get some registrations to associate messages with
    const registrationRepository =
      this.dataSource.getRepository(RegistrationEntity);
    const registrations = await registrationRepository.find({
      take: Math.min(count, 1000), // Limit to avoid memory issues
      select: ['id', 'phoneNumber'],
    });

    if (registrations.length === 0) {
      console.warn('No registrations found to associate messages with');
      return [];
    }

    const messagesData: DeepPartial<TwilioMessageEntity>[] = [];

    for (let i = 0; i < count; i++) {
      const randomRegistration =
        registrations[Math.floor(Math.random() * registrations.length)];

      messagesData.push({
        accountSid: options.accountSid,
        body: this.generateMessageBody(),
        mediaUrl: null,
        to: randomRegistration.phoneNumber || this.generatePhoneNumber(),
        from: options.from,
        sid: this.generateTwilioSid(),
        status: options.status || TwilioStatus.delivered,
        type: options.type || NotificationType.Sms,
        dateCreated: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ), // Random date in last 30 days
        registrationId: randomRegistration.id,
        userId: options.userId,
        processType: options.processType || MessageProcessType.sms,
        contentType: options.contentType || MessageContentType.custom,
        errorCode: null,
        errorMessage: null,
      });
    }

    return await this.createEntitiesBatch(messagesData);
  }

  /**
   * Duplicate existing messages (replaces mock-messages.sql)
   */
  public async duplicateExistingMessages(
    multiplier: number,
    options?: TwilioMessageFactoryOptions,
  ): Promise<TwilioMessageEntity[]> {
    console.log(`Duplicating existing messages ${multiplier} times`);

    // Get all existing messages
    const existingMessages = await this.repository.find();

    if (existingMessages.length === 0) {
      console.warn('No existing messages found to duplicate');
      return [];
    }

    const allNewMessages: TwilioMessageEntity[] = [];

    for (let iteration = 1; iteration <= multiplier; iteration++) {
      console.log(`Creating message duplication ${iteration} of ${multiplier}`);

      const newMessagesData: DeepPartial<TwilioMessageEntity>[] =
        existingMessages.map((message) => ({
          accountSid: message.accountSid || options?.accountSid || 'ACdefault',
          body: message.body || 'Mock message body',
          mediaUrl: message.mediaUrl,
          to: message.to || '+31600000000',
          from: message.from || options?.from || '+31600000001',
          sid: this.generateTwilioSid(), // Generate new unique SID
          status: message.status || TwilioStatus.delivered,
          type: message.type || NotificationType.Sms,
          dateCreated: new Date(
            Date.now() - Math.random() * 24 * 60 * 60 * 1000,
          ), // Random recent date
          registrationId: message.registrationId,
          userId: message.userId || options?.userId || 1,
          processType: message.processType || MessageProcessType.sms,
          contentType: message.contentType || MessageContentType.custom,
          errorCode: message.errorCode,
          errorMessage: message.errorMessage,
        }));

      const newMessages = await this.createEntitiesBatch(newMessagesData);
      allNewMessages.push(...newMessages);
    }

    return allNewMessages;
  }

  /**
   * Generate messages for each registration (replaces mock-messages-one-per-registration.sql)
   */
  public async generateMessagesForRegistrations(
    registrations: RegistrationEntity[],
    options: TwilioMessageFactoryOptions,
  ): Promise<TwilioMessageEntity[]> {
    console.log(
      `Generating messages for ${registrations.length} registrations`,
    );

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
        userId: options.userId || 1,
        processType: options.processType || MessageProcessType.sms,
        contentType: options.contentType || MessageContentType.custom,
        errorCode: null,
        errorMessage: null,
      }),
    );

    return await this.createEntitiesBatch(messagesData);
  }

  /**
   * Update latest messages table (replaces truncate + mock-latest-message.sql logic)
   */
  public async updateLatestMessages(): Promise<void> {
    console.log('Updating latest messages table');

    // Clear existing latest messages
    await this.dataSource.query(
      'TRUNCATE TABLE "121-service"."latest_message"',
    );

    // Insert latest messages using a more efficient query
    await this.dataSource.query(`
      INSERT INTO "121-service"."latest_message" ("registrationId", "twilioMessageId")
      SELECT DISTINCT ON ("registrationId") 
        "registrationId", 
        "id" as "twilioMessageId"
      FROM "121-service"."twilio_message"
      WHERE "registrationId" IS NOT NULL
      ORDER BY "registrationId", "created" DESC
    `);

    console.log('Latest messages table updated successfully');
  }

  /**
   * Generate a unique Twilio SID
   */
  private generateTwilioSid(): string {
    return `SM${Math.random().toString(36).substring(2, 34)}`;
  }

  /**
   * Generate sample message body
   */
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
