import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from '../../../programs/program.entity';
import { AzureLoggerMiddleware } from '../../../shared/middleware/azure-logger.middleware';
import { CustomHttpService } from '../../../shared/services/custom-http.service';
import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { BelcashRequestEntity } from './belcash-request.entity';
import { BelcashApiService } from './belcash.api.service';
import { BelcashController } from './belcash.controller';
import { BelcashService } from './belcash.service';

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
