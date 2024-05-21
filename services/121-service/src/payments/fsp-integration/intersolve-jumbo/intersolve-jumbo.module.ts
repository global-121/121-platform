import { IntersolveJumboApiMockService } from '@121-service/src/payments/fsp-integration/intersolve-jumbo/intersolve-jumbo.api-mock.service';
import { IntersolveJumboApiService } from '@121-service/src/payments/fsp-integration/intersolve-jumbo/intersolve-jumbo.api.service';
import { IntersolveJumboService } from '@121-service/src/payments/fsp-integration/intersolve-jumbo/intersolve-jumbo.service';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { UserModule } from '@121-service/src/user/user.module';
import { RegistrationDataScopedQueryService } from '@121-service/src/utils/registration-data-query/registration-data-query.service';
import { SoapService } from '@121-service/src/utils/soap/soap.service';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([RegistrationEntity]),
    UserModule,
    TransactionsModule,
    RegistrationDataModule,
  ],
  providers: [
    IntersolveJumboService,
    IntersolveJumboApiService,
    IntersolveJumboApiMockService,
    SoapService,
    CustomHttpService,
    RegistrationDataScopedQueryService,
    RegistrationScopedRepository,
  ],
  exports: [IntersolveJumboService],
})
export class IntersolveJumboModule {}
