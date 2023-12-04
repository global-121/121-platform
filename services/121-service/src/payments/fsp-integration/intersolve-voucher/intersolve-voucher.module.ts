import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TwilioMessageEntity } from '../../../notifications/twilio.entity';
import { WhatsappModule } from '../../../notifications/whatsapp/whatsapp.module';
import { ProgramFspConfigurationEntity } from '../../../programs/fsp-configuration/program-fsp-configuration.entity';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { SoapService } from '../../../utils/soap/soap.service';
import { ImageCodeModule } from '../../imagecode/image-code.module';
import { TransactionEntity } from '../../transactions/transaction.entity';
import { TransactionsModule } from '../../transactions/transactions.module';
import { CustomHttpService } from './../../../shared/services/custom-http.service';
import { IntersolveVoucherApiService } from './instersolve-voucher.api.service';
import { IntersolveVoucherMockService } from './instersolve-voucher.mock';
import { IntersolveIssueVoucherRequestEntity } from './intersolve-issue-voucher-request.entity';
import { IntersolveVoucherInstructionsEntity } from './intersolve-voucher-instructions.entity';
import { IntersolveVoucherController } from './intersolve-voucher.controller';
import { IntersolveVoucherEntity } from './intersolve-voucher.entity';
import { IntersolveVoucherService } from './intersolve-voucher.service';
import { IntersolveVoucherCronService } from './services/intersolve-voucher-cron.service';
import { QueueMessageModule } from '../../../notifications/queue-message/queue-message.module';
import { MessageTemplateModule } from '../../../notifications/message-template/message-template.module';
import { ScopeMiddleware } from '../../../shared/middleware/scope.middelware';
import { ProgramAidworkerAssignmentEntity } from '../../../programs/program-aidworker.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      IntersolveVoucherEntity,
      IntersolveIssueVoucherRequestEntity,
      IntersolveVoucherInstructionsEntity,
      RegistrationEntity,
      TransactionEntity,
      ProgramEntity,
      ProgramFspConfigurationEntity,
      UserEntity,
      TwilioMessageEntity,
      ProgramAidworkerAssignmentEntity,
    ]),
    ImageCodeModule,
    UserModule,
    TransactionsModule,
    WhatsappModule,
    QueueMessageModule,
    MessageTemplateModule,
  ],
  providers: [
    IntersolveVoucherService,
    IntersolveVoucherApiService,
    SoapService,
    IntersolveVoucherMockService,
    IntersolveVoucherCronService,
    CustomHttpService,
  ],
  controllers: [IntersolveVoucherController],
  exports: [
    IntersolveVoucherService,
    IntersolveVoucherApiService,
    IntersolveVoucherMockService,
    IntersolveVoucherCronService,
  ],
})
export class IntersolveVoucherModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ScopeMiddleware).forRoutes(IntersolveVoucherController);
  }
}
