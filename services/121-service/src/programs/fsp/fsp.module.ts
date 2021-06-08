import { IntersolveInstructionsEntity } from './intersolve-instructions.entity';
import { IntersolveRequestEntity } from './intersolve-request.entity';
import { WhatsappModule } from './../../notifications/whatsapp/whatsapp.module';
import { AfricasTalkingService } from './africas-talking.service';
import { Module, HttpModule } from '@nestjs/common';
import { FspService } from './fsp.service';
import { FspController } from './fsp.controller';
import { AfricasTalkingApiService } from './api/africas-talking.api.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from '../program/program.entity';
import { ConnectionEntity } from '../../connection/connection.entity';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { TransactionEntity } from '../program/transactions.entity';
import { FspCallLogEntity } from './fsp-call-log.entity';
import { SoapService } from './api/soap.service';
import { IntersolveApiService } from './api/instersolve.api.service';
import { IntersolveService } from './intersolve.service';
import { AfricasTalkingNotificationEntity } from './africastalking-notification.entity';
import { IntersolveBarcodeEntity } from './intersolve-barcode.entity';
import { ImageCodeService } from '../../notifications/imagecode/image-code.service';
import { ImageCodeExportVouchersEntity } from '../../notifications/imagecode/image-code-export-vouchers.entity';
import { ImageCodeEntity } from '../../notifications/imagecode/image-code.entity';
import { FspAttributeEntity } from './fsp-attribute.entity';
import { UserModule } from '../../user/user.module';
import { IntersolveMockService } from './api/instersolve.mock';

@Module({
  imports: [
    HttpModule,
    UserModule,
    WhatsappModule,
    TypeOrmModule.forFeature([
      ProgramEntity,
      ConnectionEntity,
      FinancialServiceProviderEntity,
      TransactionEntity,
      FspCallLogEntity,
      AfricasTalkingNotificationEntity,
      IntersolveInstructionsEntity,
      IntersolveBarcodeEntity,
      IntersolveRequestEntity,
      ImageCodeExportVouchersEntity,
      ImageCodeEntity,
      FspAttributeEntity,
    ]),
  ],
  providers: [
    AfricasTalkingService,
    FspService,
    AfricasTalkingApiService,
    IntersolveService,
    IntersolveApiService,
    IntersolveMockService,
    SoapService,
    ImageCodeService,
  ],
  controllers: [FspController],
  exports: [
    AfricasTalkingService,
    FspService,
    AfricasTalkingApiService,
    IntersolveService,
    IntersolveApiService,
    IntersolveMockService,
    SoapService,
    ImageCodeService,
  ],
})
export class FspModule {}
