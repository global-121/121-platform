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

  public async generateReconciliationReport(): Promise<{
    filename: string;
    content: OnafriqReconciliationReport[];
  }> {
    const report: OnafriqReconciliationReport[] = [];
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const onafriqTransactions =
      await this.onafriqTransactionScopedRepository.find({
        where: {
          transaction: {
            created: Between(yesterday, today),
          },
        },
        relations: ['transaction'],
      });

    for (const onafriqTransaction of onafriqTransactions) {
      const reportItem: OnafriqReconciliationReport = {
        Datestamp: onafriqTransaction.transaction.created.toISOString(),
        'Transaction ID': onafriqTransaction.thirdPartyTransId,
        'Onafriq Transaction ID': onafriqTransaction.mfsTransId,
        Third_PartyID: onafriqTransaction.thirdPartyTransId,
        Transaction_Type: 'Transfer', // 'Transfer' or 'Reversal'. We use only 'Transfer'.
        Transaction_Status: onafriqTransaction.transaction.status, // ##TODO: map to 'Success', 'Fail', 'Pending'?
        From_MSISDN: '123', // ##TODO: get from env
        To_MSISDN: onafriqTransaction.recipientMsisdn,
        Send_Currency: null, // We use 'Receive' type, so this is  N.A.
        Receive_Currency: env.ONAFRIQ_CURRENCY_CODE!,
        Send_amount: null, // We use 'Receive' type, so this is  N.A.
        Receive_amount: onafriqTransaction.transaction.amount,
        Fee_Amount: null, // We use 'Receive' type, so this is  N.A.
        Balance_before: null, // ##TODO: store and calculated?
        Balance_after: null, // ##TODO: store and calculated?
        Related_Transaction_ID: null, // N.A. for Transaction_Type = 'Transfer'
        Wallet_Identifier: env.ONAFRIQ_CORPORATE_CODE!,
        Partner_name: env.ONAFRIQ_CORPORATE_CODE!,
      };
      report.push(reportItem);
    }
    return {
      filename: `${env.ONAFRIQ_CORPORATE_CODE}_${this.formatDateToYYYY_MM_DD(today)}_01.csv`, // 01 indicates version-nr per day. We will only have one report per day, so this is always 01.
      content: report,
    };
  }

  private formatDateToYYYY_MM_DD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}_${month}_${day}`;
  }
}
