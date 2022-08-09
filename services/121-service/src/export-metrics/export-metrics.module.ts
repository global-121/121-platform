import { ProgramEntity } from './../programs/program.entity';
import { UserEntity } from './../user/user.entity';
import { RegistrationEntity } from './../registration/registration.entity';
import { ActionModule } from './../actions/action.module';
import { ExportMetricsService } from './export-metrics.service';
import { ExportMetricsController } from './export-metrics.controller';
import { RegistrationsModule } from './../registration/registrations.module';
import { Module } from '@nestjs/common';
import { ProgramModule } from '../programs/programs.module';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { PaymentsModule } from '../payments/payments.module';
import { TransactionsModule } from '../payments/transactions/transactions.module';
import { RegistrationDataEntity } from '../registration/registration-data.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramQuestionEntity,
      FinancialServiceProviderEntity,
      FspQuestionEntity,
      RegistrationEntity,
      TransactionEntity,
      UserEntity,
      ProgramEntity,
      RegistrationDataEntity,
    ]),
    ProgramModule,
    UserModule,
    RegistrationsModule,
    ActionModule,
    PaymentsModule,
    TransactionsModule,
    RegistrationsModule,
  ],
  providers: [ExportMetricsService],
  controllers: [ExportMetricsController],
  exports: [],
})
export class ExportMetricsModule {}
