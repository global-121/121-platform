import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { env } from '@121-service/src/env';
import { ExchangeRateEntity } from '@121-service/src/exchange-rates/exchange-rate.entity';
import { MonitoringDataService } from '@121-service/src/monitoring-data/monitoring-data.service';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExchangeRateEntity,
      RegistrationEntity,
      TransactionEntity,
    ]),
  ],
  providers: [
    MonitoringDataService,
    {
      provide: ContainerClient,
      useFactory: async () => {
        const blobServiceClient = BlobServiceClient.fromConnectionString(
          env.AZURE_STORAGE_CONNECTION_STRING,
        );

        const containerClient = blobServiceClient.getContainerClient(
          env.AZURE_STORAGE_CONTAINER_NAME,
        );

        await containerClient.createIfNotExists();

        return containerClient;
      },
    },
  ],
  exports: [MonitoringDataService],
})
export class MonitoringDataModule {}
