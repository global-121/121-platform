import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomHttpService } from '../../../shared/services/custom-http.service';
import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { RegistrationEntity } from './../../../registration/registration.entity';
import { IntersolveIssueTokenRequestEntity } from './intersolve-issue-token-request.entity';
import { IntersolveLoadRequestEntity } from './intersolve-load-request.entity';
import { IntersolveVisaApiMockService } from './intersolve-visa-api-mock.services';
import { IntersolveVisaCardEntity } from './intersolve-visa-card.entity';
import { IntersolveVisaCustomerEntity } from './intersolve-visa-customer.entity';
import { IntersolveVisaApiService } from './intersolve-visa.api.service';
import { IntersolveVisaService } from './intersolve-visa.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      IntersolveVisaCardEntity,
      IntersolveIssueTokenRequestEntity,
      UserEntity,
      IntersolveLoadRequestEntity,
      RegistrationEntity,
      IntersolveVisaCustomerEntity,
    ]),
    UserModule,
    TransactionsModule,
  ],
  providers: [
    IntersolveVisaService,
    IntersolveVisaApiService,
    IntersolveVisaApiMockService,
    CustomHttpService,
  ],
  exports: [
    IntersolveVisaService,
    IntersolveVisaApiService,
    IntersolveVisaApiMockService,
  ],
})
export class IntersolveVisaModule {}
