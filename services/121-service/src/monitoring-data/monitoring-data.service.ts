import { ContainerClient } from '@azure/storage-blob';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { env } from '@121-service/src/env';
import { ExchangeRateEntity } from '@121-service/src/exchange-rates/exchange-rate.entity';
import {
  MonitoringDataRegistrationDto,
  MonitoringDataTransactionDto,
  PushMonitoringDataDto,
} from '@121-service/src/monitoring-data/dtos/push-monitoring-data.dto';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

interface RegistrationQueryResult {
  status: string | null;
  programId: number;
  programTitlePortal: unknown;
}

interface TransactionQueryResult {
  id: number;
  status: string;
  amount: number | null;
  localCurrency: string | null;
  createdDate: Date;
  updatedDate: Date;
  registrationReferenceId: string | null;
  programId: number;
  programTitlePortal: unknown;
}

@Injectable()
export class MonitoringDataService {
  @InjectRepository(ExchangeRateEntity)
  private readonly exchangeRateRepository: Repository<ExchangeRateEntity>;

  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  @InjectRepository(TransactionEntity)
  private readonly transactionRepository: Repository<TransactionEntity>;

  public constructor(
    @Inject(ContainerClient)
    private readonly containerClient: ContainerClient,
  ) {}

  public async pushMonitoringDataToCentralStorage(): Promise<PushMonitoringDataDto> {
    const snapshotDate = this.getSnapshotDate();
    const instance = this.getInstanceName();
    const version = env.GLOBAL_121_VERSION ?? 'unknown';

    const registrations = await this.getRegistrations({
      instance,
      version,
      uploadDate: snapshotDate,
    });
    const transactions = await this.getTransactions({
      instance,
      version,
      uploadDate: snapshotDate,
    });

    await Promise.all([
      this.uploadData({
        data: registrations,
        blobPath: `${snapshotDate}/registrations/${instance}.json`,
      }),
      this.uploadData({
        data: transactions,
        blobPath: `${snapshotDate}/transactions/${instance}.json`,
      }),
    ]);

    return {
      registrations,
      transactions,
    };
  }

  private async getRegistrations({
    instance,
    version,
    uploadDate,
  }: {
    instance: string;
    version: string;
    uploadDate: string;
  }): Promise<MonitoringDataRegistrationDto[]> {
    const registrations =
      await this.registrationRepository
        .createQueryBuilder('registration')
        .innerJoin('registration.program', 'program')
        .select('registration.registrationStatus', 'status')
        .addSelect('program.id', 'programId')
        .addSelect('program.titlePortal', 'programTitlePortal')
        .getRawMany<RegistrationQueryResult>();

    return registrations.map((registration) => ({
      instance,
      version,
      programTitle: this.getProgramTitle({
        titlePortal: registration.programTitlePortal,
      }),
      programId: registration.programId,
      status: registration.status ?? '',
      uploadDate,
    }));
  }

  private async getTransactions({
    instance,
    version,
    uploadDate,
  }: {
    instance: string;
    version: string;
    uploadDate: string;
  }): Promise<MonitoringDataTransactionDto[]> {
    const transactions = await this.getTransactionRows();
    const exchangeRatesByCurrency = await this.getExchangeRatesByCurrency({
      transactions,
    });

    return transactions.map((transaction) => {
      const amount = transaction.amount ?? 0;
      const localCurrency = transaction.localCurrency ?? '';
      const amountEuro =
        amount *
        this.getLocalToEuroRate({
          localCurrency,
          exchangeRatesByCurrency,
        });
      const amountChf = this.calculateAmountInChf({
        amountEuro,
        exchangeRatesByCurrency,
      });

      return {
        instance,
        version,
        programId: transaction.programId,
        programTitle: this.getProgramTitle({
          titlePortal: transaction.programTitlePortal,
        }),
        id: transaction.id,
        status: transaction.status,
        amountEuro,
        amountChf,
        amount,
        localCurrency,
        createdDate: transaction.createdDate.toISOString(),
        updatedDate: transaction.updatedDate.toISOString(),
        registrationReferenceId: transaction.registrationReferenceId ?? '',
        uploadDate,
      };
    });
  }

  private async getTransactionRows(): Promise<TransactionQueryResult[]> {
    return await this.transactionRepository
      .createQueryBuilder('transaction')
      .innerJoin('transaction.registration', 'registration')
      .innerJoin('transaction.payment', 'payment')
      .innerJoin('payment.program', 'program')
      .select('transaction.id', 'id')
      .addSelect('transaction.status', 'status')
      .addSelect('transaction.transferValue', 'amount')
      .addSelect('transaction.created', 'createdDate')
      .addSelect('transaction.updated', 'updatedDate')
      .addSelect('registration.referenceId', 'registrationReferenceId')
      .addSelect('program.id', 'programId')
      .addSelect('program.titlePortal', 'programTitlePortal')
      .addSelect('program.currency', 'localCurrency')
      .getRawMany<TransactionQueryResult>();
  }

  private async getExchangeRatesByCurrency({
    transactions,
  }: {
    transactions: TransactionQueryResult[];
  }): Promise<Map<string, number>> {
    const currencies = Array.from(
      new Set(
        transactions
          .map((transaction) => transaction.localCurrency)
          .filter((currency): currency is string => !!currency && currency !== ''),
      ),
    );
    currencies.push('CHF');

    const rates = await this.exchangeRateRepository
      .createQueryBuilder('exchangeRate')
      .select('exchangeRate.currency', 'currency')
      .addSelect('exchangeRate.euroExchangeRate', 'euroExchangeRate')
      .where('exchangeRate.currency IN (:...currencies)', { currencies })
      .orderBy('exchangeRate.created', 'DESC')
      .getRawMany<{ currency: string; euroExchangeRate: number }>();

    const exchangeRatesByCurrency = new Map<string, number>();
    exchangeRatesByCurrency.set('EUR', 1);
    for (const rate of rates) {
      if (!exchangeRatesByCurrency.has(rate.currency)) {
        exchangeRatesByCurrency.set(rate.currency, Number(rate.euroExchangeRate));
      }
    }

    return exchangeRatesByCurrency;
  }

  private getLocalToEuroRate({
    localCurrency,
    exchangeRatesByCurrency,
  }: {
    localCurrency: string;
    exchangeRatesByCurrency: Map<string, number>;
  }): number {
    if (localCurrency === 'EUR') {
      return 1;
    }

    return exchangeRatesByCurrency.get(localCurrency) ?? 0;
  }

  private calculateAmountInChf({
    amountEuro,
    exchangeRatesByCurrency,
  }: {
    amountEuro: number;
    exchangeRatesByCurrency: Map<string, number>;
  }): number {
    const chfToEuroRate = exchangeRatesByCurrency.get('CHF');
    if (!chfToEuroRate) {
      return 0;
    }

    return amountEuro / chfToEuroRate;
  }

  private async uploadData({
    data,
    blobPath,
  }: {
    data: unknown;
    blobPath: string;
  }): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
    await blockBlobClient.uploadData(Buffer.from(JSON.stringify(data)), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });
  }

  private getSnapshotDate(): string {
    const snapshotDate = new Date();
    snapshotDate.setUTCDate(snapshotDate.getUTCDate() - 1);
    return snapshotDate.toISOString().split('T')[0];
  }

  private getInstanceName(): string {
    const instance = env.MONITORING_DATA_INSTANCE ?? env.ENV_NAME ?? 'unknown';
    return instance.toLowerCase().replaceAll(/\s+/g, '-');
  }

  private getProgramTitle({
    titlePortal,
  }: {
    titlePortal: unknown;
  }): string {
    const parsedTitlePortal = this.parseTitlePortal({ titlePortal });

    if (!parsedTitlePortal || typeof parsedTitlePortal !== 'object') {
      return '';
    }

    if (
      'en' in parsedTitlePortal &&
      typeof parsedTitlePortal.en === 'string' &&
      parsedTitlePortal.en
    ) {
      return parsedTitlePortal.en;
    }

    const title = Object.values(parsedTitlePortal).find(
      (value) => typeof value === 'string' && value,
    );
    return typeof title === 'string' ? title : '';
  }

  private parseTitlePortal({
    titlePortal,
  }: {
    titlePortal: unknown;
  }): unknown {
    if (typeof titlePortal !== 'string') {
      return titlePortal;
    }

    try {
      return JSON.parse(titlePortal);
    } catch {
      return null;
    }
  }
}
