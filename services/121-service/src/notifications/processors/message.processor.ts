import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MessageService } from '../message.service';
import { ProcessName, ProcessorName } from './processor.names.enum';

@Processor(ProcessorName.message)
export class MessageProcessor {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessName.send)
  async handleSend(job: Job): Promise<any> {
    const messageJobData = job.data;
    await this.messageService.sendTextMessage(messageJobData).catch((error) => {
      console.warn('Error in handleSend: ', error);
    });
  }
}
