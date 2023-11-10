import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MessageService } from '../message.service';
import { AzureLogService } from '../../shared/services/azure-log.service';
import { ProcessName, ProcessorName } from '../enum/processor.names.enum';

@Processor(ProcessorName.message)
export class MessageProcessor {
  constructor(
    private readonly messageService: MessageService,
    private readonly azureLogService: AzureLogService,
  ) {}

  @Process(ProcessName.send)
  async handleSend(job: Job): Promise<any> {
    const messageJobData = job.data;
    await this.messageService.sendTextMessage(messageJobData).catch((err) => {
      this.azureLogService.logError(err, false);
      throw err;
    });
  }
}
