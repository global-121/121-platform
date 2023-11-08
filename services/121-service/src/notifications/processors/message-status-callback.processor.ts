import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { WhatsappIncomingService } from '../whatsapp/whatsapp-incoming.service';

@Processor('messageStatusCallback')
export class MessageStatusCallbackProcessor {
  constructor(
    private readonly whatsappIncomingService: WhatsappIncomingService,
  ) {}

  @Process('send')
  async handleStatusCallback(job: Job): Promise<any> {
    const callbackData = job.data;
    // console.log('callbackData: ', callbackData.MessageStatus);
    await this.whatsappIncomingService
      .processStatusCallback(callbackData)
      .catch((error) => {
        console.warn('Error in handleStatusCallback: ', error);
      });
  }
}
