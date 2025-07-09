import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Between, Equal } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { env } from '@121-service/src/env';
import { OnafriqTransactionEntity } from '@121-service/src/payments/fsp-integration/onafriq/entities/onafriq-transaction.entity';
import { OnafriqTransactionCallbackDto } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/dtos/onafriq-transaction-callback.dto';
import { OnafriqTransactionCallbackJobDto } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/dtos/onafriq-transaction-callback-job.dto';
import { OnafriqApiCallbackStatusCode } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/enum/onafriq-api-callback-status-code.enum';
import { OnafriqTransactionStatus } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/enum/onafriq-transaction-status.enum';
import { OnafriqReconciliationReport } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/interfaces/onafriq-reconciliation-report.interface';
import { OnafriqReconciliationMapper } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/onafriq-reconciliation.mapper';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Injectable()
export class OnafriqReconciliationService {
  public constructor(
    @Inject(getScopedRepositoryProviderName(OnafriqTransactionEntity))
    private readonly onafriqTransactionScopedRepository: ScopedRepository<OnafriqTransactionEntity>,
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly queuesService: QueuesRegistryService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  public async processTransactionCallback(
    onafriqTransactionCallback: OnafriqTransactionCallbackDto,
  ): Promise<void> {
    const onafriqTransactionCallbackJob: OnafriqTransactionCallbackJobDto = {
      thirdPartyTransId: onafriqTransactionCallback.thirdPartyTransId,
      mfsTransId: onafriqTransactionCallback.mfsTransId,
      statusCode: onafriqTransactionCallback.status.code,
      statusMessage: onafriqTransactionCallback.status.message,
    };

    const job = await this.queuesService.onafriqCallbackQueue.add(
      JobNames.default,
      onafriqTransactionCallbackJob,
    );

    await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
  }

  public async processOnafriqTransactionCallbackJob(
    onafriqTransactionCallbackJob: OnafriqTransactionCallbackJobDto,
  ): Promise<void> {
    const { transactionId } =
      await this.onafriqTransactionScopedRepository.findOneOrFail({
        where: {
          thirdPartyTransId: Equal(
            onafriqTransactionCallbackJob.thirdPartyTransId,
          ),
        },
        select: {
          transactionId: true,
        },
      });

    // Update the Onafriq transaction with the mfsTransId
    // ##TODO: update this in callback diagram
    await this.onafriqTransactionScopedRepository.update(
      { transactionId: Equal(transactionId) },
      { mfsTransId: onafriqTransactionCallbackJob.mfsTransId },
    );

    // Prepare the transaction status based on statusCode from callback
    let updatedTransactionStatusAndErrorMessage: QueryDeepPartialEntity<TransactionEntity> =
      {};
    switch (
      this.classifyOnafriqStatus(onafriqTransactionCallbackJob.statusCode)
    ) {
      case OnafriqTransactionStatus.success:
        updatedTransactionStatusAndErrorMessage = {
          status: TransactionStatusEnum.success,
        };
        break;
      case OnafriqTransactionStatus.error:
        updatedTransactionStatusAndErrorMessage = {
          status: TransactionStatusEnum.error,
          errorMessage: `Error: ${onafriqTransactionCallbackJob.statusCode} - ${onafriqTransactionCallbackJob.statusMessage}`,
        };
        break;
      default:
        // NOTE: This should not happen according to Onafriq. Does this cover this unexpected situation enough?
        console.log(
          `POST /onafriq/callback - Unexpected status code received. Code: ${onafriqTransactionCallbackJob.statusCode}, Message: ${onafriqTransactionCallbackJob.statusMessage}`,
        );
    }

    await this.transactionScopedRepository.update(
      { id: transactionId },
      updatedTransactionStatusAndErrorMessage,
    );
  }

  private classifyOnafriqStatus(code: string): OnafriqTransactionStatus {
    if (code === OnafriqApiCallbackStatusCode.success) {
      return OnafriqTransactionStatus.success;
    }
    if (code.startsWith('ER')) {
      return OnafriqTransactionStatus.error;
    }
    return OnafriqTransactionStatus.other;
  }

  public async generateReconciliationReport(isTest?: boolean): Promise<{
    filename: string;
    csv: string;
  }> {
    const yesterdayStart = new Date();
    yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - (isTest ? 0 : 1)); // In production use yesterday, in test use todays
    yesterdayStart.setUTCHours(0, 0, 0, 0);

    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setUTCHours(23, 59, 59, 999);

    const onafriqTransactions =
      await this.onafriqTransactionScopedRepository.find({
        where: {
          transaction: {
            created: Between(yesterdayStart, yesterdayEnd),
          },
        },
        relations: ['transaction'],
      });

    const report: OnafriqReconciliationReport[] = onafriqTransactions.map(
      (onafriqTransaction) =>
        OnafriqReconciliationMapper.mapTransactionToReportItem(
          onafriqTransaction,
        ),
    );

    const csv =
      report.length === 0
        ? ''
        : Object.keys(report[0]).join(',') +
          '\n' +
          report.map((row) => Object.values(row).join(',')).join('\n');
    return {
      filename: `${env.ONAFRIQ_CORPORATE_CODE}_${this.formatDateToYYYY_MM_DD(new Date())}_01.csv`, // 01 indicates version-nr per day. We will only have one report per day, so this is always 01.
      csv,
    };
  }

  private formatDateToYYYY_MM_DD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}_${month}_${day}`;
  }
}
