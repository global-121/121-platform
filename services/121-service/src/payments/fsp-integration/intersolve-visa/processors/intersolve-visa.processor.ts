import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ProcessName, QueueNamePayment } from '../../../enum/queue.names.enum';
import { IntersolveVisaService } from '../intersolve-visa.service';

@Processor(QueueNamePayment.paymentIntersolveVisa)
export class PaymentProcessorIntersolveVisa {
  constructor(private readonly intersolveVisaService: IntersolveVisaService) {}

  @Process(ProcessName.sendPayment)
  async handleSendPayment(job: Job): Promise<void> {
    await this.intersolveVisaService.processQueuedPayment(job.data);
  }
}
