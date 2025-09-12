import { Process } from '@nestjs/bull';
import { Job } from 'bull';

import { TwilioStatusCallbackDto } from '@121-service/src/notifications/dto/twilio.dto';
import { ProcessNameMessage } from '@121-service/src/notifications/enum/process-names.enum';
import { MessageIncomingService } from '@121-service/src/notifications/message-incoming/message-incoming.service';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@RegisteredProcessor(QueueNames.messageCallbackStatus)
export class MessageStatusCallbackProcessor {
  constructor(
    private readonly messageIncomingService: MessageIncomingService,
    private readonly azureLogService: AzureLogService,
  ) {}

  @Process(ProcessNameMessage.whatsapp)
  async handleStatusCallbackWhatsapp(
    job: Job<TwilioStatusCallbackDto>,
  ): Promise<void> {
    const callbackData = job.data;
    await this.messageIncomingService
      .processWhatsappStatusCallback(callbackData)
      .catch((err) => {
        this.azureLogService.logError(err, false);
        throw err;
      });
  }

  @Process(ProcessNameMessage.sms)
  async handleStatusCallbackSms(
    job: Job<TwilioStatusCallbackDto>,
  ): Promise<void> {
    const callbackData = job.data;
    await this.messageIncomingService
      .processSmsStatusCallback(callbackData)
      .catch((err) => {
        this.azureLogService.logError(err, false);
        throw err;
      });
  }
}
