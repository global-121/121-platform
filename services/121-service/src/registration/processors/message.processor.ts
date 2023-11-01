import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('message')
export class MessageProcessor {
  @Process('send')
  handleSend(job: Job): any {
    console.log('job: ', job);
  }
}
