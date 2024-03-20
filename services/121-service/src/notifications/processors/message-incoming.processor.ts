import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AzureLogService } from '../../shared/services/azure-log.service';
import {
  ProcessNameMessage,
  QueueNameMessageCallBack,
} from '../enum/queue.names.enum';
import { MessageIncomingService } from '../message-incoming/message-incoming.service';
@Processor(QueueNameMessageCallBack.incomingMessage)
export class MessageIncomingProcessor {
  constructor(
    private readonly messageIncomingService: MessageIncomingService,
    private readonly azureLogService: AzureLogService,
  ) {}

  @Process(ProcessNameMessage.whatsapp)
  async handleIncomingWhatsapp(job: Job): Promise<void> {
    const callbackData = job.data;
    await this.messageIncomingService
      .processIncomingWhatsapp(callbackData)
      .catch((err) => {
        this.azureLogService.logError(err, false);
        throw err;
      });
  }
}
