import { TransactionsModule } from './../transactions/transactions.module';
import { UserEntity } from './../../user/user.entity';
import { Module, HttpModule, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntersolveService } from './intersolve.service';
import { IntersolveController } from './intersolve.controller';
import { IntersolveBarcodeEntity } from './intersolve-barcode.entity';
import { IntersolveRequestEntity } from './intersolve-request.entity';
import { IntersolveInstructionsEntity } from './intersolve-instructions.entity';
import { IntersolveApiService } from './instersolve.api.service';
import { SoapService } from './soap.service';
import { WhatsappModule } from '../../notifications/whatsapp/whatsapp.module';
import { ImageCodeModule } from '../imagecode/image-code.module';
import { IntersolveMockService } from './instersolve.mock';
import { RegistrationEntity } from '../../registration/registration.entity';
import { TransactionEntity } from '../transactions/transaction.entity';
import { ProgramEntity } from '../../programs/program.entity';
import { UserModule } from '../../user/user.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      IntersolveBarcodeEntity,
      IntersolveRequestEntity,
      IntersolveInstructionsEntity,
      RegistrationEntity,
      TransactionEntity,
      ProgramEntity,
      UserEntity,
    ]),
    ImageCodeModule,
    UserModule,
    TransactionsModule,
    forwardRef(() => WhatsappModule),
  ],
  providers: [
    IntersolveService,
    IntersolveApiService,
    SoapService,
    IntersolveMockService,
  ],
  controllers: [IntersolveController],
  exports: [
    IntersolveService,
    IntersolveApiService,
    SoapService,
    IntersolveMockService,
  ],
})
export class IntersolveModule {}
