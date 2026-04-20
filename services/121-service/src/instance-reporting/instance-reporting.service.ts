import { Injectable } from '@nestjs/common';

import { IS_PRODUCTION } from '@121-service/src/config';
import { env } from '@121-service/src/env';
import { ExchangeRatesService } from '@121-service/src/exchange-rates/services/exchange-rates.service';
import { InstanceReportingRegistrationDto } from '@121-service/src/instance-reporting/dtos/instance-reporting-registration.dto';
import { InstanceReportingTransactionDto } from '@121-service/src/instance-reporting/dtos/instance-reporting-transaction.dto';
import { PushInstanceReportingDataResponseDto } from '@121-service/src/instance-reporting/dtos/push-instance-reporting-data-response.dto';
import { InstanceReportingBlobService } from '@121-service/src/instance-reporting/instance-reporting-blob.service';
import { InstanceReportingDataMapper } from '@121-service/src/instance-reporting/mappers/instance-reporting-data.mapper';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { RegistrationRepository } from '@121-service/src/registration/repositories/registration.repository';

// This service loads all registrations and transactions into memory at once.
// With ~1M transactions this may use ~1-2GB of heap memory. This is acceptable
// because:
// - The Node.js heap limit is ~4GB (default on our App Service plan)
// - This cronjob runs at night when application load is minimal
// - If dataset size grows significantly, consider streaming batches directly
//   to blob storage to reduce peak memory usage.

@Injectable()
export class InstanceReportingService {
  constructor(
    private readonly registrationRepository: RegistrationRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly exchangeRatesService: ExchangeRatesService,
    private readonly instanceReportingBlobService: InstanceReportingBlobService,
  ) {}

  public async getInstanceReportingData(): Promise<PushInstanceReportingDataResponseDto> {
    const instance = this.getInstanceName();
    const uploadDate = this.getUploadDate();

    const [registrations, transactions] = await Promise.all([
      this.getRegistrationData({ instance, uploadDate }),
      this.getTransactionData({ instance, uploadDate }),
    ]);

    return { registrations, transactions };
  }

  public async pushInstanceReportingData(): Promise<PushInstanceReportingDataResponseDto | void> {
    const data = await this.getInstanceReportingData();
    await this.instanceReportingBlobService.uploadReportingData({
      data,
      uploadDate: this.getUploadDate(),
    });

    // Only return data in non-production environments to avoid sending
    // potentially millions of rows over the network in the HTTP response.
    if (!IS_PRODUCTION) {
      return data;
    }
  }

  private async getRegistrationData({
    instance,
    uploadDate,
  }: {
    instance: string;
    uploadDate: string;
  }): Promise<InstanceReportingRegistrationDto[]> {
    const registrations =
      await this.registrationRepository.findForInstanceReporting();

    return registrations.map((registration) =>
      InstanceReportingDataMapper.mapRegistration({
        registration,
        instance,
        uploadDate,
      }),
    );
  }

  private async getTransactionData({
    instance,
    uploadDate,
  }: {
    instance: string;
    uploadDate: string;
  }): Promise<InstanceReportingTransactionDto[]> {
    const exchangeRateMap =
      await this.exchangeRatesService.getExchangeRateHistoryMap();

    const transactions =
      await this.transactionRepository.findForInstanceReporting();

    return transactions.map((transaction) =>
      InstanceReportingDataMapper.mapTransaction({
        transaction,
        instance,
        amountEuro: this.exchangeRatesService.convertToEuro({
          amount: transaction.transferValue,
          fromCurrency: transaction.registration.program.currency,
          transactionDate: transaction.created,
          exchangeRateMap,
        }),
        uploadDate,
      }),
    );
  }

  private getUploadDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getInstanceName(): string {
    if (!env.ENV_NAME) {
      throw new Error(
        'ENV_NAME must be set to push instance reporting data. Each instance needs a unique name to avoid overwriting data.',
      );
    }
    return env.ENV_NAME;
  }
}
