import {
  ProcessNameMessage,
  QueueNameMessageCallBack,
} from '@121-service/src/notifications/enum/queue.names.enum';
import { MessageIncomingService } from '@121-service/src/notifications/message-incoming/message-incoming.service';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
@Processor(QueueNameMessageCallBack.status)
export class MessageStatusCallbackProcessor {
  constructor(
    private readonly messageIncomingService: MessageIncomingService,
    private readonly azureLogService: AzureLogService,
  ) {}

  @Process(ProcessNameMessage.whatsapp)
  async handleStatusCallbackWhatsapp(job: Job): Promise<void> {
    const callbackData = job.data;
    await this.messageIncomingService
      .processWhatsappStatusCallback(callbackData)
      .catch((err) => {
        this.azureLogService.logError(err, false);
        throw err;
      });
  }

  @Process(ProcessNameMessage.sms)
  async handleStatusCallbackSms(job: Job): Promise<void> {
    const callbackData = job.data;
    console.log(callbackData, 'callbackData1');
    await this.messageIncomingService
      .processSmsStatusCallback(callbackData)
      .catch((err) => {
        this.azureLogService.logError(err, false);
        throw err;
      });
  }
}
