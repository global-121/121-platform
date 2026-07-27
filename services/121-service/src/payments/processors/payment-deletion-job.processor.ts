import { Process } from '@nestjs/bull';
import { Job } from 'bull';

import { PaymentDeletionJob } from '@121-service/src/payments/interfaces/payment-deletion-job.interface';
import { PaymentsDeletionService } from '@121-service/src/payments/services/payments-deletion.service';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@RegisteredProcessor(QueueNames.paymentDeletion)
export class PaymentDeletionJobProcessor {
  constructor(
    private readonly paymentsDeletionService: PaymentsDeletionService,
  ) {}

  @Process(JobNames.default)
  async handlePaymentDeletionJob(job: Job<PaymentDeletionJob>): Promise<void> {
    await this.paymentsDeletionService.processPaymentDeletionJob(job.data);
  }
}
