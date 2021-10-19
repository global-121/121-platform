import { Module, HttpModule, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { PaymentsService } from './payments.service';
import { UserModule } from '../user/user.module';
import { TransactionEntity } from '../programs/transactions.entity';
import { RegistrationEntity } from '../registration/registration.entity';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { ActionModule } from '../actions/action.module';
import { AfricasTalkingModule } from './africas-talking/africas-talking.module';
import { FspModule } from '../fsp/fsp.module';
import { IntersolveModule } from './intersolve/intersolve.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      TransactionEntity,
      RegistrationEntity,
      FinancialServiceProviderEntity,
    ]),
    UserModule,
    HttpModule,
    ActionModule,
    FspModule,
    forwardRef(() => IntersolveModule),
    forwardRef(() => AfricasTalkingModule),
    ,
  ],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
