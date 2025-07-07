import { Process } from '@nestjs/bull';
import { Job } from 'bull';

import { ProcessNameMessage } from '@121-service/src/notifications/enum/process-names.enum';
import { MessageIncomingService } from '@121-service/src/notifications/message-incoming/message-incoming.service';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@RegisteredProcessor(QueueNames.messageCallbackIncoming)
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
