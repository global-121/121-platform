import { Process } from '@nestjs/bull';
import { Job } from 'bull';

import { MtnReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/mtn/mtn-reconciliation.service';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@RegisteredProcessor(QueueNames.paymentReconciliationMtnTransfer)
export class TransferReconciliationJobProcessorMtn {
  constructor(
    private readonly mtnReconciliationService: MtnReconciliationService,
  ) {}

  @Process(JobNames.default)
  async handleMtnTransferReconciliationJob(job: Job): Promise<void> {
    await this.mtnReconciliationService.processMtnTransferReconciliationJob(
      job.data,
    );
  }
}
