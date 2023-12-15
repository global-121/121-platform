import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ProcessName, QueueNamePayment } from '../enum/queue.names.enum';
import { IntersolveVisaService } from '../intersolve-visa.service';

@Processor(QueueNamePayment.paymentIntersolveVisa)
export class PaymentProcessorIntersolveVisa {
  constructor(private readonly paymentService: IntersolveVisaService) {}

  @Process(ProcessName.sendPayment)
  async handleSendPayment(job: Job): Promise<void> {
    await this.paymentService.processQueuedPayment(job.data);
  }
}
