import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ProcessName, QueueNamePayment } from '../../../enum/queue.names.enum';
import { CommercialBankEthiopiaService } from '../commercial-bank-ethiopia.service';

@Processor(QueueNamePayment.paymentCommercialBankEthiopia)
export class PaymentProcessorCommercialBankEthiopia {
  constructor(
    private readonly commercialBankEthiopiaService: CommercialBankEthiopiaService,
  ) {}

  @Process(ProcessName.sendPayment)
  async handleSendPayment(job: Job): Promise<void> {
    await this.commercialBankEthiopiaService.processQueuedPayment(job.data);
  }
}
