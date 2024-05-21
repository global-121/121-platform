import { BelcashRequestEntity } from '@121-service/src/payments/fsp-integration/belcash/belcash-request.entity';
import { BelcashApiService } from '@121-service/src/payments/fsp-integration/belcash/belcash.api.service';
import { BelcashController } from '@121-service/src/payments/fsp-integration/belcash/belcash.controller';
import { BelcashService } from '@121-service/src/payments/fsp-integration/belcash/belcash.service';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { AzureLoggerMiddleware } from '@121-service/src/shared/middleware/azure-logger.middleware';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { UserModule } from '@121-service/src/user/user.module';
import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([ProgramEntity, BelcashRequestEntity]),
    UserModule,
    TransactionsModule,
  ],
  providers: [BelcashService, BelcashApiService, CustomHttpService],
  controllers: [BelcashController],
  exports: [BelcashService, BelcashApiService],
})
export class BelcashModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AzureLoggerMiddleware).forRoutes(BelcashController);
  }
}
