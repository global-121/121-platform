import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { env } from '@121-service/src/env';
import { ExchangeRatesModule } from '@121-service/src/exchange-rates/exchange-rates.module';
import { InstanceReportingService } from '@121-service/src/instance-reporting/instance-reporting.service';
import { InstanceReportingBlobService } from '@121-service/src/instance-reporting/instance-reporting-blob.service';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationRepository } from '@121-service/src/registration/repositories/registration.repository';

const INSTANCE_REPORTING_CONTAINER_NAME = 'instance-reporting-data';

@Module({
  imports: [
    TypeOrmModule.forFeature([RegistrationEntity, ProgramEntity]),
    ExchangeRatesModule,
    TransactionsModule,
  ],
  providers: [
    InstanceReportingService,
    InstanceReportingBlobService,
    RegistrationRepository,
    {
      provide: ContainerClient,
      useFactory: async () => {
        const blobServiceClient = BlobServiceClient.fromConnectionString(
          env.AZURE_STORAGE_CONNECTION_STRING,
        );
        const containerClient = blobServiceClient.getContainerClient(
          INSTANCE_REPORTING_CONTAINER_NAME,
        );
        await containerClient.createIfNotExists();
        return containerClient;
      },
    },
  ],
  exports: [InstanceReportingService],
})
export class InstanceReportingModule {}
