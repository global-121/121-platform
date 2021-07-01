import { ProgramEntity } from './../../programs/program/program.entity';
import { ConnectionEntity } from './../../connection/connection.entity';
import { TransactionEntity } from './../../programs/program/transactions.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthMiddlewareTwilio } from '../auth.middlewareTwilio';
import {
  Module,
  MiddlewareConsumer,
  RequestMethod,
  NestModule,
  forwardRef,
} from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { TwilioMessageEntity } from '../twilio.entity';
import { ImageCodeModule } from '../imagecode/image-code.module';
import { IntersolveBarcodeEntity } from '../../programs/fsp/intersolve-barcode.entity';
import { FspModule } from '../../programs/fsp/fsp.module';
import { API_PATHS } from '../../config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TwilioMessageEntity,
      IntersolveBarcodeEntity,
      TransactionEntity,
      ConnectionEntity,
      ProgramEntity,
    ]),
    ImageCodeModule,
    forwardRef(() => FspModule),
  ],
  providers: [WhatsappService],
  controllers: [WhatsappController],
  exports: [WhatsappService],
})
export class WhatsappModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddlewareTwilio).forRoutes(
      {
        path: API_PATHS.whatsAppStatus,
        method: RequestMethod.POST,
      },
      {
        path: API_PATHS.whatsAppIncoming,
        method: RequestMethod.POST,
      },
    );
  }
}
