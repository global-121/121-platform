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
    const updateResult = await this.latestMessageRepository.update(
      {
        registrationId: latestMessage.registrationId,
      },
      latestMessage,
    );
    if (updateResult.affected === 0) {
      await this.latestMessageRepository.insert(latestMessage);
    }
  }
}
