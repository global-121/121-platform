import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationDataEntity } from '../../../registration/registration-data.entity';
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
      UserEntity,
      ProgramEntity,
      RegistrationEntity,
      RegistrationDataEntity,
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
