import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MessageIncomingService } from '../whatsapp/message-incoming.service';

@Processor('messageStatusCallback')
export class MessageStatusCallbackProcessor {
  constructor(
    private readonly messageIncomingService: MessageIncomingService,
  ) {}

  @Process('send')
  async handleStatusCallback(job: Job): Promise<any> {
    const callbackData = job.data;
    // TODO: is this substring check too heavy? Alternative is to have separate queues/processors/etc for whatsapp/sms
    if (callbackData.To.includes('whatsapp')) {
      await this.messageIncomingService
        .processWhatsappStatusCallback(callbackData)
        .catch((error) => {
          console.warn('Error in Whatsapp handleStatusCallback: ', error);
        });
    } else {
      await this.messageIncomingService
        .processSmsStatusCallback(callbackData)
        .catch((error) => {
          console.warn('Error in SMS handleStatusCallback: ', error);
        });
    }
  }
}
