import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { PaymentsModule } from '../payments/payments.module';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { TransactionsModule } from '../payments/transactions/transactions.module';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { ProgramModule } from '../programs/programs.module';
import { RegistrationDataEntity } from '../registration/registration-data.entity';
import { UserModule } from '../user/user.module';
import { ActionModule } from './../actions/action.module';
import { ProgramEntity } from './../programs/program.entity';
import { RegistrationEntity } from './../registration/registration.entity';
import { RegistrationsModule } from './../registration/registrations.module';
import { UserEntity } from './../user/user.entity';
import { ExportMetricsController } from './export-metrics.controller';
import { ExportMetricsService } from './export-metrics.service';

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
  ],
  providers: [ExportMetricsService],
  controllers: [ExportMetricsController],
  exports: [],
})
export class ExportMetricsModule {}
