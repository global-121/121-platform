import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, Equal, In } from 'typeorm';

import { TwilioMessageEntity } from '@121-service/src/notifications/entities/twilio.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { BaseDataFactory } from '@121-service/src/scripts/factories/base-data-factory';

@Injectable()
export class TwilioMessageDataFactory extends BaseDataFactory<TwilioMessageEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, dataSource.getRepository(TwilioMessageEntity));
  }

  public async extendMessagesToAllRegistrations(
    programId: number,
  ): Promise<void> {
    const registrationRepo = this.dataSource.getRepository(RegistrationEntity);
    const messageRepo = this.dataSource.getRepository(TwilioMessageEntity);
    const registrations = await registrationRepo.find({
      where: { programId: Equal(programId) },
      select: { id: true }, // Only select id to optimize query
      relations: { transactions: true },
      order: { id: 'ASC' },
    });
    console.log(
      `Generating messages for ${registrations.length} registrations`,
    );

    // Find the initial seeded registration and its messages
    const initialRegistration = registrations[0];
    const initialMessages = await messageRepo.find({
      where: { registration: Equal(initialRegistration.id) },
    });

    // Find all registrations
    const messagesData: DeepPartial<TwilioMessageEntity>[] = [];
    const defaultOptions = this.getDefaultMessageOptions();
    for (const registration of registrations.filter(
      (r) => r.id !== initialRegistration.id, // Do not insert the initial registration's messages again
    )) {
      // Replicate each message for this registration as a new entity
      for (const message of initialMessages) {
        // Omit id and registration, copy all other properties
        const { id: _id, registration: _omit, ...messageData } = message;
        messagesData.push({
          ...messageData,
          accountSid: message.accountSid || defaultOptions.accountSid, // has 'select: false' in entity
          from: message.from || defaultOptions.from, // has 'select: false' in entity
          transactionId: null, // Leads to unique constraint violation otherwise, and this link is not used in load testing for now
          registrationId: registration.id,
        });
      }
    }
    await this.insertEntitiesBatch(messagesData);
  }

  public async duplicateExistingMessages(batchSize = 2500): Promise<void> {
    console.log(`Duplicating existing messages in batches of ${batchSize}`);

    // Fetch all original message IDs at the start
    const originalIds: number[] = (
      await this.repository.find({ select: { id: true }, order: { id: 'ASC' } })
    ).map((m) => m.id);
    if (originalIds.length === 0) {
      console.warn('No existing messages found to duplicate');
      return;
    }

    const defaultOptions = this.getDefaultMessageOptions();
    // Additional batching is needed here to not create too large array in memory to pass to insertEntitiesBatch
    let totalProcessed = 0;
    for (let offset = 0; offset < originalIds.length; offset += batchSize) {
      const batchIds = originalIds.slice(offset, offset + batchSize);
      const batch = await this.repository.find({ where: { id: In(batchIds) } });
      const newMessagesData: DeepPartial<TwilioMessageEntity>[] = batch.map(
        (message) => ({
          accountSid: message.accountSid || defaultOptions.accountSid,
          body: message.body,
          mediaUrl: message.mediaUrl,
          to: message.to,
          from: message.from || defaultOptions.from,
          sid: this.generateTwilioSid(),
          status: message.status,
          type: message.type,
          dateCreated: new Date(
            Date.now() - Math.random() * 24 * 60 * 60 * 1000,
          ),
          registrationId: message.registrationId,
          userId: message.userId || 1,
          processType: message.processType,
          contentType: message.contentType,
          errorCode: message.errorCode,
          errorMessage: message.errorMessage,
        }),
      );
      await this.insertEntitiesBatch(newMessagesData, batchSize);
      totalProcessed += batch.length;
      console.log(`Duplicated ${totalProcessed} messages so far...`);
    }
  }

  private getDefaultMessageOptions() {
    return {
      accountSid: 'AC_test_account_sid',
      from: '+1234567890',
    };
  }

  public async updateLatestMessages(): Promise<void> {
    console.log('Updating latest messages table');

    // Clear existing latest messages
    await this.dataSource.query(
      'TRUNCATE TABLE "121-service"."latest_message"',
    );

    // TODO: migrate to typed approach
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
}
