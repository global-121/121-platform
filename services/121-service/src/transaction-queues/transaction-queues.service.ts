import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';
import { AirtelTransactionJobDto } from '@121-service/src/transaction-queues/dto/airtel-transaction-job.dto';
import { CommercialBankEthiopiaTransactionJobDto } from '@121-service/src/transaction-queues/dto/commercial-bank-ethiopia-transaction-job.dto';
import { ExcelTransactionJobDto } from '@121-service/src/transaction-queues/dto/excel-transaction-job.dto';
import { IntersolveVisaTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { IntersolveVoucherTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-voucher-transaction-job.dto';
import { NedbankTransactionJobDto } from '@121-service/src/transaction-queues/dto/nedbank-transaction-job.dto';
import { OnafriqTransactionJobDto } from '@121-service/src/transaction-queues/dto/onafriq-transaction-job.dto';
import { SafaricomTransactionJobDto } from '@121-service/src/transaction-queues/dto/safaricom-transaction-job.dto';

@Injectable()
export class TransactionQueuesService {
  public constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
    private readonly queuesService: QueuesRegistryService,
  ) {}

  public async addIntersolveVisaTransactionJobs(
    transferJobs: IntersolveVisaTransactionJobDto[],
  ): Promise<void> {
    for (const transferJob of transferJobs) {
      const job =
        await this.queuesService.transactionJobIntersolveVisaQueue.add(
          JobNames.default,
          transferJob,
        );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
  }

  public async addIntersolveVoucherTransactionJobs(
    transferJobs: IntersolveVoucherTransactionJobDto[],
  ): Promise<void> {
    for (const transferJob of transferJobs) {
      const job =
        await this.queuesService.transactionJobIntersolveVoucherQueue.add(
          JobNames.default,
          transferJob,
        );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
  }

  public async addSafaricomTransactionJobs(
    safaricomTransactionJobs: SafaricomTransactionJobDto[],
  ): Promise<void> {
    for (const safaricomTransactionJob of safaricomTransactionJobs) {
      const job = await this.queuesService.transactionJobSafaricomQueue.add(
        JobNames.default,
        safaricomTransactionJob,
      );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
  }

  public async addAirtelTransactionJobs(
    airtelTransactionJobs: AirtelTransactionJobDto[],
  ): Promise<void> {
    for (const airtelTransactionJob of airtelTransactionJobs) {
      const job = await this.queuesService.transactionJobAirtelQueue.add(
        JobNames.default,
        airtelTransactionJob,
      );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
  }

  public async addNedbankTransactionJobs(
    nedbankTransactionJobs: NedbankTransactionJobDto[],
  ): Promise<void> {
    for (const nedbankTransactionJob of nedbankTransactionJobs) {
      const job = await this.queuesService.transactionJobNedbankQueue.add(
        JobNames.default,
        nedbankTransactionJob,
      );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
  }

  public async addOnafriqTransactionJobs(
    onafriqTransactionJobs: OnafriqTransactionJobDto[],
  ): Promise<void> {
    for (const onafriqTransactionJob of onafriqTransactionJobs) {
      const job = await this.queuesService.transactionJobOnafriqQueue.add(
        JobNames.default,
        onafriqTransactionJob,
      );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
  }

  public async addCommercialBankOfEthiopiaTransactionJobs(
    commercialBankOfEthiopiaTransactionJobs: CommercialBankEthiopiaTransactionJobDto[],
  ): Promise<void> {
    for (const commercialBankOfEthiopiaTransactionJob of commercialBankOfEthiopiaTransactionJobs) {
      const job =
        await this.queuesService.transactionJobCommercialBankEthiopiaQueue.add(
          JobNames.default,
          commercialBankOfEthiopiaTransactionJob,
        );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
  }

  public async addExcelTransactionJobs(
    excelTransactionJobs: ExcelTransactionJobDto[],
  ): Promise<void> {
    for (const excelTransactionJob of excelTransactionJobs) {
      const job = await this.queuesService.transactionJobExcelQueue.add(
        JobNames.default,
        excelTransactionJob,
      );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
  }
}
