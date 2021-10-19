import { Module, HttpModule } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { PaymentsService } from './payments.service';
import { UserModule } from '../user/user.module';
import { TransactionEntity } from '../programs/transactions.entity';
import { RegistrationEntity } from '../registration/registration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      TransactionEntity,
      RegistrationEntity,
    ]),
    UserModule,
    HttpModule,
  ],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
