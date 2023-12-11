import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomHttpService } from '../../../shared/services/custom-http.service';
import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { RegistrationDataScopedQueryService } from '../../../utils/registration-data-query/registration-data-query.service';
import { TransactionsModule } from '../../transactions/transactions.module';
import { IntersolveVisaApiMockService } from './intersolve-visa-api-mock.service';
import { IntersolveVisaCustomerEntity } from './intersolve-visa-customer.entity';
import { IntersolveVisaWalletEntity } from './intersolve-visa-wallet.entity';
import { IntersolveVisaApiService } from './intersolve-visa.api.service';
import { IntersolveVisaController } from './intersolve-visa.controller';
import { IntersolveVisaService } from './intersolve-visa.service';
import { IntersolveVisaExportService } from './services/intersolve-visa-export.service';
import { IntersolveVisaStatusMappingService } from './services/intersolve-visa-status-mapping.service';
import { QueueMessageModule } from '../../../notifications/queue-message/queue-message.module';
import { ProgramAidworkerAssignmentEntity } from '../../../programs/program-aidworker.entity';
import { Module } from '@nestjs/common';
import { createScopedRepositoryProvider } from '../../../utils/scope/createScopedRepositoryProvider.helper';
import { RegistrationScopedRepository } from '../../../registration/registration-scoped.repository';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([UserEntity, ProgramAidworkerAssignmentEntity]),
    UserModule,
    TransactionsModule,
    QueueMessageModule,
  ],
  providers: [
    IntersolveVisaService,
    IntersolveVisaApiService,
    IntersolveVisaApiMockService,
    CustomHttpService,
    RegistrationDataScopedQueryService,
    IntersolveVisaExportService,
    IntersolveVisaStatusMappingService,
    RegistrationScopedRepository,
    createScopedRepositoryProvider(IntersolveVisaWalletEntity),
    createScopedRepositoryProvider(IntersolveVisaCustomerEntity),
  ],
  controllers: [IntersolveVisaController],
  exports: [
    IntersolveVisaService,
    IntersolveVisaApiService,
    IntersolveVisaApiMockService,
    IntersolveVisaExportService,
  ],
})
export class IntersolveVisaModule {}
