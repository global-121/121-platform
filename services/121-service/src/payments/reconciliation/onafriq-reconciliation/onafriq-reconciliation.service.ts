import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Equal } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { OnafriqTransactionEntity } from '@121-service/src/payments/fsp-integration/onafriq/entities/onafriq-transaction.entity';
import { OnafriqTransactionCallbackDto } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/dtos/onafriq-transaction-callback.dto';
import { OnafriqTransactionCallbackJobDto } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/dtos/onafriq-transaction-callback-job.dto';
import { OnafriqApiCallbackStatusCode } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/enum/onafriq-api-callback-status-code.enum';
import { OnafriqTransactionStatus } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/enum/onafriq-transaction-status.enum';
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
      return OnafriqTransactionStatus.Success;
    }
    if (code.startsWith('ER')) {
      return OnafriqTransactionStatus.Error;
    }
    return OnafriqTransactionStatus.Unknown;
  }
}
