import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import fs from 'node:fs';
import SftpClient from 'ssh2-sftp-client';
import { Between, Equal, FindOperator } from 'typeorm';

import { IS_PRODUCTION } from '@121-service/src/config';
import { env } from '@121-service/src/env';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
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
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Injectable()
export class OnafriqReconciliationService {
  private sftp: SftpClient;

  public constructor(
    @Inject(getScopedRepositoryProviderName(OnafriqTransactionEntity))
    private readonly onafriqTransactionScopedRepository: ScopedRepository<OnafriqTransactionEntity>,
    private readonly transactionsService: TransactionsService,
    private readonly queuesService: QueuesRegistryService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly programRepository: ProgramRepository,
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
    const onafriqTransaction =
      await this.onafriqTransactionScopedRepository.findOneOrFail({
        where: {
          thirdPartyTransId: Equal(
            onafriqTransactionCallbackJob.thirdPartyTransId,
          ),
        },
        relations: { transaction: { transactionEvents: true } },
      });
    const transactionId = onafriqTransaction.transactionId;

    // Update the Onafriq transaction with the mfsTransId
    await this.onafriqTransactionScopedRepository.update(
      { transactionId: Equal(transactionId) },
      { mfsTransId: onafriqTransactionCallbackJob.mfsTransId },
    );

    const onafriqTransactionStatus = this.classifyOnafriqStatus(
      onafriqTransactionCallbackJob.statusCode,
    );

    let transactionStatus: TransactionStatusEnum;
    let errorMessage: string | undefined;
    switch (onafriqTransactionStatus) {
      case OnafriqTransactionStatus.success:
        transactionStatus = TransactionStatusEnum.success;
        break;
      case OnafriqTransactionStatus.error:
        transactionStatus = TransactionStatusEnum.error;
        errorMessage = `Error: ${onafriqTransactionCallbackJob.statusCode} - ${onafriqTransactionCallbackJob.statusMessage}`;
        break;
      default:
        // NOTE: This should not happen according to Onafriq. Does this cover this unexpected situation enough?
        console.log(
          `POST /onafriq/callback - Unexpected status code received. Code: ${onafriqTransactionCallbackJob.statusCode}, Message: ${onafriqTransactionCallbackJob.statusMessage}`,
        );
        return; // Exit early for unexpected status codes
    }

    await this.transactionsService.saveProgressFromExternalSource({
      transactionId,
      description: TransactionEventDescription.onafriqCallbackReceived,
      newTransactionStatus: transactionStatus,
      errorMessage,
    });
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

  public async sendReconciliationReport(): Promise<number> {
    const programs = await this.programRepository.find();
    let result = 0;
    for (const program of programs) {
      const report = await this.generateAndSendReconciliationReportYesterday({
        programId: program.id,
      });
      result += report.length;
    }
    return result;
  }

  public async generateAndSendReconciliationReportYesterday({
    programId,
    toDate,
    fromDate,
  }: {
    programId: number;
    toDate?: Date;
    fromDate?: Date;
  }): Promise<OnafriqReconciliationReport[]> {
    let createdFilter: FindOperator<Date>;
    if (fromDate || toDate) {
      // if at least one provided, assume date range with open on the other end
      const fromDateFilter = fromDate || new Date(2000, 1, 1);
      const toDateFilter = toDate || new Date();
      createdFilter = Between(fromDateFilter, toDateFilter);
    } else {
      // if no date range provide, assume yesterday. This is the cron/production scenario.
      const yesterdayStart = new Date();
      yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1); // In production use yesterday
      yesterdayStart.setUTCHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterdayStart);
      yesterdayEnd.setUTCHours(23, 59, 59, 999);
      createdFilter = Between(yesterdayStart, yesterdayEnd);
    }
    const where = {
      transaction: {
        payment: { programId: Equal(programId) },
        created: createdFilter,
      },
    };

    const onafriqTransactions =
      await this.onafriqTransactionScopedRepository.find({
        where,
        relations: ['transaction'],
      });

    const fspConfigs =
      await this.programFspConfigurationRepository.getByProgramIdAndFspName({
        programId,
        fspName: Fsps.onafriq,
      });
    if (fspConfigs.length === 0) {
      // No Onafriq FSP configured for this program, so nothing to send. Without this, the cronjobs.test API-test breaks.
      return [];
    }
    const programFspConfigProperties =
      await this.programFspConfigurationRepository.getPropertiesByNamesOrThrow({
        programFspConfigurationId: fspConfigs[0].id, // There will be just 1 fspConfig per program for Onafriq
        names: [FspConfigurationProperties.corporateCodeOnafriq],
      });
    const corporateCode = programFspConfigProperties[0].value as string;

    const report: OnafriqReconciliationReport[] = onafriqTransactions.map(
      (onafriqTransaction) =>
        OnafriqReconciliationMapper.mapTransactionToReportItem(
          onafriqTransaction,
          corporateCode,
        ),
    );

    // Only send to SFTP if transactions, and only on production (staging also has IS_PRODUCTION, but also MOCK_ONAFRIQ=true. // REFACTOR: this is not full-proof)
    // NOTE: If you need to touch this code and test locally, make sure to clean up any test results on sftp location.
    if (report.length > 0 && IS_PRODUCTION && !env.MOCK_ONAFRIQ) {
      const csvContent =
        Object.keys(report[0]).join(',') +
        '\n' +
        report.map((row) => Object.values(row).join(',')).join('\n');
      const filename = `${corporateCode}_${this.formatDateToYYYY_MM_DD(
        new Date(), // Use current date for the filename
      )}_01.csv`; // 01 indicates version-nr per day. We will only have one report per day, so this is always 01.

      await this.sendCsvToOnafriqSftpLocation(csvContent, filename);
    }

    // Return for testing and cron batchSize
    return report;
  }

  private async sendCsvToOnafriqSftpLocation(
    csvContent: string,
    filename: string,
  ): Promise<void> {
    // Initialize SFTP client lazily to prevent error when injecting this via constructors
    if (!this.sftp) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Client = require('ssh2-sftp-client');
      this.sftp = new Client();
    }

    try {
      const privateKey =
        env.ONAFRIQ_SFTP_CERTIFICATE_CONTENT || // remote env
        fs.readFileSync(env.ONAFRIQ_SFTP_CERTIFICATE_PATH!, 'utf8'); // local env

      await this.sftp.connect({
        host: env.ONAFRIQ_SFTP_HOST,
        port: env.ONAFRIQ_SFTP_PORT,
        username: env.ONAFRIQ_SFTP_USERNAME,
        privateKey,
        passphrase: env.ONAFRIQ_SFTP_PASSPHRASE,
      });

      const buffer = Buffer.from(csvContent, 'utf8');
      await this.sftp.put(buffer, `DTR/${filename}`);
    } catch (err) {
      console.error('SFTP upload error:', err);
      throw err;
    } finally {
      void this.sftp.end();
    }
  }

  private formatDateToYYYY_MM_DD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}_${month}_${day}`;
  }
}
