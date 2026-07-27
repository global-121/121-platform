import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { PaymentDeletionJob } from '@121-service/src/payments/interfaces/payment-deletion-job.interface';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

const PAYMENT_DELETION_JOB_ATTEMPTS = 5;
const PAYMENT_DELETION_JOB_BACKOFF_MS = 10_000;

@Injectable()
export class PaymentsDeletionService {
  @InjectRepository(PaymentEntity)
  private readonly paymentRepository: Repository<PaymentEntity>;

  public constructor(
    private readonly transactionsService: TransactionsService,
    private readonly queuesRegistryService: QueuesRegistryService,
    private readonly azureLogService: AzureLogService,
  ) {}

  public async addPaymentDeletionJobToQueue({
    paymentId,
  }: {
    paymentId: number;
  }): Promise<void> {
    const job: PaymentDeletionJob = { paymentId };
    await this.queuesRegistryService.paymentDeletionQueue.add(
      JobNames.default,
      job,
      {
        jobId: paymentId,
        attempts: PAYMENT_DELETION_JOB_ATTEMPTS,
        backoff: { type: 'exponential', delay: PAYMENT_DELETION_JOB_BACKOFF_MS },
        removeOnFail: false,
      },
    );
  }

  public async processPaymentDeletionJob({
    paymentId,
  }: PaymentDeletionJob): Promise<void> {
    try {
      await this.transactionsService.deleteTransactionsByPaymentId({
        paymentId,
      });
      await this.paymentRepository.delete({ id: Equal(paymentId) });
    } catch (error) {
      this.azureLogService.logError(
        new Error(
          `Failed to clean up soft-deleted payment with id ${paymentId}: ${error}`,
        ),
        true,
      );
      throw error;
    }
  }
}
