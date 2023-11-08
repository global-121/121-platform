import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MessageService } from '../message.service';

@Processor('message')
export class MessageProcessor {
  constructor(private readonly messageService: MessageService) {}

  @Process('send')
  async handleSend(job: Job): Promise<any> {
    const messageJobData = job.data;
    // console.log('messageJobData: ', messageJobData.id);
    await this.messageService.sendTextMessage(messageJobData).catch((error) => {
      console.warn('Error in handleSend: ', error);
    });
  }
}
