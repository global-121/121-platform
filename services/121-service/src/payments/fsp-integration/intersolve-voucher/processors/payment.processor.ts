import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ProcessName, QueueNamePayment } from '../../../enum/queue.names.enum';
import { IntersolveVoucherService } from '../intersolve-voucher.service';

@Processor(QueueNamePayment.paymentIntersolveVoucher)
export class PaymentProcessorIntersolveVoucher {
  constructor(
    private readonly intersolveVoucherService: IntersolveVoucherService,
  ) {}

  @Process(ProcessName.sendPayment)
  async handleSendPayment(job: Job): Promise<void> {
    console.log('job: ', job.data);
    await this.intersolveVoucherService.processQueuedPayment(job.data);
  }
}
