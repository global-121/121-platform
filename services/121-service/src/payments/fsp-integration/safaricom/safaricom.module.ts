import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from '../../../payments/transactions/transaction.entity';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { AzureLoggerMiddleware } from '../../../shared/middleware/azure-logger.middleware';
import { CustomHttpService } from '../../../shared/services/custom-http.service';
import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { SafaricomRequestEntity } from './safaricom-request.entity';
import { SafaricomApiService } from './safaricom.api.service';
import { SafaricomController } from './safaricom.controller';
import { SafaricomService } from './safaricom.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      TransactionEntity,
      RegistrationEntity,
      SafaricomRequestEntity,
    ]),
    UserModule,
    TransactionsModule,
  ],
  providers: [SafaricomService, SafaricomApiService, CustomHttpService],
  controllers: [SafaricomController],
  exports: [SafaricomService, SafaricomApiService],
})
export class SafaricomModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AzureLoggerMiddleware).forRoutes(SafaricomController);
  }
}
