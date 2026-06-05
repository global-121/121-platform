import { Process } from '@nestjs/bull';
import { Job } from 'bull';

import { MtnReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/mtn/mtn-reconciliation.service';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@RegisteredProcessor(QueueNames.paymentCallbackMtnTransfer)
export class TransferCallbackJobProcessorMtn {
  constructor(
    private readonly mtnReconciliationService: MtnReconciliationService,
  ) {}

  @Process(JobNames.default)
  async handleMtnTransferCallbackJob(job: Job): Promise<void> {
    await this.mtnReconciliationService.processMtnTransferCallbackJob(job.data);
  }
}
