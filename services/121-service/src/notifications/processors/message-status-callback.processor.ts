import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MessageIncomingService } from '../message-incoming/message-incoming.service';
import { ProcessorName, ProcessName } from '../enum/processor.names.enum';
@Processor(ProcessorName.messageStatusCallback)
export class MessageStatusCallbackProcessor {
  constructor(
    private readonly messageIncomingService: MessageIncomingService,
  ) {}

  @Process(ProcessName.whatsapp)
  async handleStatusCallbackWhatsapp(job: Job): Promise<void> {
    const callbackData = job.data;
    await this.messageIncomingService.processWhatsappStatusCallback(
      callbackData,
    );
  }

  @Process(ProcessName.sms)
  async handleStatusCallbackSms(job: Job): Promise<void> {
    const callbackData = job.data;
    await this.messageIncomingService.processSmsStatusCallback(callbackData);
  }
}
