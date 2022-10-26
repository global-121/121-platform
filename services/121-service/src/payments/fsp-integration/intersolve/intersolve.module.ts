import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappModule } from '../../../notifications/whatsapp/whatsapp.module';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { ImageCodeModule } from '../../imagecode/image-code.module';
import { TransactionEntity } from '../../transactions/transaction.entity';
import { TransactionsModule } from '../../transactions/transactions.module';
import { IntersolveApiService } from './instersolve.api.service';
import { IntersolveMockService } from './instersolve.mock';
import { IntersolveBarcodeEntity } from './intersolve-barcode.entity';
import { IntersolveInstructionsEntity } from './intersolve-instructions.entity';
import { IntersolveRequestEntity } from './intersolve-request.entity';
import { IntersolveController } from './intersolve.controller';
import { IntersolveService } from './intersolve.service';
import { SoapService } from './soap.service';

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
