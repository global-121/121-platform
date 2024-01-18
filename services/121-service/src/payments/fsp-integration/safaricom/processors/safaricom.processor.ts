import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ProcessName, QueueNamePayment } from '../../../enum/queue.names.enum';
import { SafaricomService } from '../safaricom.service';

@Processor(QueueNamePayment.paymentSafaricom)
export class PaymentProcessorSafaricom {
  constructor(private readonly safaricomService: SafaricomService) {}

  @Process(ProcessName.sendPayment)
  async handleSendPayment(job: Job): Promise<void> {
    await this.safaricomService.processQueuedPayment(job.data);
  }
}
