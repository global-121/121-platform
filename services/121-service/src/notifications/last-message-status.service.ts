import { LatestMessageEntity } from '@121-service/src/notifications/latest-message.entity';
import { TwilioMessageEntity } from '@121-service/src/notifications/twilio.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class LastMessageStatusService {
  @InjectRepository(LatestMessageEntity)
  private readonly latestMessageRepository: Repository<LatestMessageEntity>;

  public async updateLatestMessage(
    message: TwilioMessageEntity,
  ): Promise<void> {
    // If registraitonId is null, it means that the message is not related to a registration
    // and therefore we don't need to update the latest message status
    // This is the case when we get message from an unknown number
    if (!message.registrationId) {
      return;
    }
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
      await this.latestMessageRepository.delete({
        messageId: latestMessage.messageId,
      });
      await this.latestMessageRepository.insert(latestMessage);
    }
  }
}
