import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import Redis from 'ioredis';

import { AirtelTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/airtel-transaction-job.dto';
import { CommercialBankEthiopiaTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/commercial-bank-ethiopia-transaction-job.dto';
import { CooperativeBankOfOromiaTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/cooperative-bank-of-oromia-transaction-job.dto';
import { ExcelTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/excel-transaction-job.dto';
import { IntersolveVisaTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { IntersolveVoucherTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/intersolve-voucher-transaction-job.dto';
import { MtnTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/mtn-transaction-job.dto';
import { NedbankTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/nedbank-transaction-job.dto';
import { OnafriqTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/onafriq-transaction-job.dto';
import { SafaricomTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/safaricom-transaction-job.dto';
import { SharedTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/shared-transaction-job.dto';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

@Injectable()
export class TransactionQueuesService {
  public constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
    private readonly queuesService: QueuesRegistryService,
  ) {}

  public async addIntersolveVisaTransactionJobs(
    visaTransactionJobs: IntersolveVisaTransactionJobDto[],
  ): Promise<void> {
    await this.addTransactionJobsToQueue({
      queue: this.queuesService.transactionJobIntersolveVisaQueue,
      transactionJobs: visaTransactionJobs,
    });
  }

  public async addIntersolveVoucherTransactionJobs(
    voucherTransactionJobs: IntersolveVoucherTransactionJobDto[],
  ): Promise<void> {
    await this.addTransactionJobsToQueue({
      queue: this.queuesService.transactionJobIntersolveVoucherQueue,
      transactionJobs: voucherTransactionJobs,
    });
  }

  public async addSafaricomTransactionJobs(
    safaricomTransactionJobs: SafaricomTransactionJobDto[],
  ): Promise<void> {
    await this.addTransactionJobsToQueue({
      queue: this.queuesService.transactionJobSafaricomQueue,
      transactionJobs: safaricomTransactionJobs,
    });
  }

  public async addAirtelTransactionJobs(
    airtelTransactionJobs: AirtelTransactionJobDto[],
  ): Promise<void> {
    await this.addTransactionJobsToQueue({
      queue: this.queuesService.transactionJobAirtelQueue,
      transactionJobs: airtelTransactionJobs,
    });
  }

  public async addCooperativeBankOfOromiaTransactionJobs(
    cooperativeBankOfOromiaTransactionJobs: CooperativeBankOfOromiaTransactionJobDto[],
  ): Promise<void> {
    await this.addTransactionJobsToQueue({
      queue: this.queuesService.transactionJobCooperativeBankOfOromiaQueue,
      transactionJobs: cooperativeBankOfOromiaTransactionJobs,
    });
  }

  public async addNedbankTransactionJobs(
    nedbankTransactionJobs: NedbankTransactionJobDto[],
  ): Promise<void> {
    await this.addTransactionJobsToQueue({
      queue: this.queuesService.transactionJobNedbankQueue,
      transactionJobs: nedbankTransactionJobs,
    });
  }

  public async addOnafriqTransactionJobs(
    onafriqTransactionJobs: OnafriqTransactionJobDto[],
  ): Promise<void> {
    await this.addTransactionJobsToQueue({
      queue: this.queuesService.transactionJobOnafriqQueue,
      transactionJobs: onafriqTransactionJobs,
    });
  }

  public async addCommercialBankOfEthiopiaTransactionJobs(
    commercialBankOfEthiopiaTransactionJobs: CommercialBankEthiopiaTransactionJobDto[],
  ): Promise<void> {
    await this.addTransactionJobsToQueue({
      queue: this.queuesService.transactionJobCommercialBankEthiopiaQueue,
      transactionJobs: commercialBankOfEthiopiaTransactionJobs,
    });
  }

  public async addExcelTransactionJobs(
    excelTransactionJobs: ExcelTransactionJobDto[],
  ): Promise<void> {
    await this.addTransactionJobsToQueue({
      queue: this.queuesService.transactionJobExcelQueue,
      transactionJobs: excelTransactionJobs,
    });
  }

  public async addMtnTransactionJobs(
    mtnTransactionJobs: MtnTransactionJobDto[],
  ): Promise<void> {
    await this.addTransactionJobsToQueue({
      queue: this.queuesService.transactionJobMtnQueue,
      transactionJobs: mtnTransactionJobs,
    });
  }

  private async addTransactionJobsToQueue({
    queue,
    transactionJobs,
  }: {
    queue: Queue;
    transactionJobs: SharedTransactionJobDto[];
  }): Promise<void> {
    if (transactionJobs.length === 0) {
      return;
    }

    const jobs = await queue.addBulk(
      transactionJobs.map((transactionJob) => ({
        name: JobNames.default,
        data: transactionJob,
      })),
    );

    const jobIds = jobs
      .filter((job) => job.id != null)
      .map((job) => String(job.id));

    if (jobIds.length > 0) {
      const redisSetName = getRedisSetName(transactionJobs[0].programId);
      const batchSize = 10_000;
      const pipeline = this.redisClient.pipeline();
      for (let i = 0; i < jobIds.length; i += batchSize) {
        const batch = jobIds.slice(i, i + batchSize);
        pipeline.sadd(redisSetName, ...batch);
      }
      const results = await pipeline.exec();
      if (results == null) {
        throw new Error(
          `Failed to add job IDs to Redis set ${redisSetName}: pipeline aborted`,
        );
      }
      for (const [error] of results) {
        if (error) {
          throw error;
        }
      }
    }
  }
}
