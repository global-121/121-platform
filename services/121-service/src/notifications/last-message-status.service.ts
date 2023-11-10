import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TwilioMessageEntity } from './twilio.entity';
import { LatestMessageEntity } from './latest-message.entity';

@Injectable()
export class LastMessageStatusService {
  @InjectRepository(LatestMessageEntity)
  private readonly latestMessageRepository: Repository<LatestMessageEntity>;

  public async updateLatestMessage(
    message: TwilioMessageEntity,
  ): Promise<void> {
    const latestMessage = new LatestMessageEntity();
    latestMessage.registrationId = message.registrationId;
    latestMessage.messageId = message.id;
    try {
      // Try to insert a new LatestTransactionEntity
      await this.latestMessageRepository.insert(latestMessage);
    } catch (error) {
      if (error.code === '23505') {
        // 23505 is the code for unique violation in PostgreSQL
        // If a unique constraint violation occurred, update the existing LatestMessageEntity
        await this.latestMessageRepository.update(
          {
            registrationId: latestMessage.registrationId,
          },
          latestMessage,
        );
      } else {
        // If some other error occurred, rethrow it
        throw error;
      }
    }
  }
}
