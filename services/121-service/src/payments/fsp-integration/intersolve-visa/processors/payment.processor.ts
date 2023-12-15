import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import {
  ProcessName,
  QueueNameMessageCallBack,
} from '../enum/queue.names.enum';
import { IntersolveVisaService } from '../intersolve-visa.service';

@Processor(QueueNameMessageCallBack.paymentIntersolveVisa)
export class PaymentIntersolveVisaSinglePaymentConsumer {
  constructor(private readonly paymentService: IntersolveVisaService) {}

  @Process(ProcessName.sendSinglePayment)
  async handleSend(job: Job): Promise<void> {
    await this.paymentService.sendQueuePayment(job.data);
  }
}
