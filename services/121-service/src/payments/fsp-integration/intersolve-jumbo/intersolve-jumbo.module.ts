import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { CustomHttpService } from '../../../shared/services/custom-http.service';
import { UserModule } from '../../../user/user.module';
import { RegistrationDataQueryService } from '../../../utils/registration-data-query/registration-data-query.service';
import { TransactionsModule } from '../../transactions/transactions.module';
import { SoapService } from './../../../utils/soap/soap.service';
import { IntersolveJumboApiMockService } from './intersolve-jumbo.api-mock.service';
import { IntersolveJumboApiService } from './intersolve-jumbo.api.service';
import { IntersolveJumboService } from './intersolve-jumbo.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([RegistrationEntity, ProgramEntity]),
    UserModule,
    TransactionsModule,
  ],
  providers: [
    IntersolveJumboService,
    IntersolveJumboApiService,
    IntersolveJumboApiMockService,
    SoapService,
    CustomHttpService,
    RegistrationDataQueryService,
  ],
  exports: [IntersolveJumboService],
})
export class IntersolveJumboModule {}
