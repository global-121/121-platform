import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { RegistrationsModule } from '../../../registration/registrations.module';
import { UserModule } from '../../../user/user.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { SoapService } from './../../../utils/soap/soap.service';
import { IntersolveJumboApiService } from './intersolve-jumbo.api.service';
import { IntersolveJumboMockService } from './intersolve-jumbo.mock';
import { IntersolveJumboService } from './intersolve-jumbo.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([RegistrationEntity]),
    UserModule,
    TransactionsModule,
    RegistrationsModule,
  ],
  providers: [
    IntersolveJumboService,
    IntersolveJumboApiService,
    IntersolveJumboMockService,
    SoapService,
  ],
  exports: [IntersolveJumboService],
})
export class IntersolveJumboModule {}
