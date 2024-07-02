import { FinancialServiceProvidersController } from '@121-service/src/financial-service-providers/financial-service-provider.controller';
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { FinancialServiceProvidersService } from '@121-service/src/financial-service-providers/financial-service-provider.service';
import { FspQuestionEntity } from '@121-service/src/financial-service-providers/fsp-question.entity';
import { FinancialServiceProviderQuestionRepository } from '@121-service/src/financial-service-providers/repositories/financial-service-provider-question.repository';
import { FinancialServiceProviderRepository } from '@121-service/src/financial-service-providers/repositories/financial-service-provider.repository';
import { UserModule } from '@121-service/src/user/user.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    HttpModule,
    UserModule,
    TypeOrmModule.forFeature([
      FinancialServiceProviderEntity,
      FspQuestionEntity,
    ]),
  ],
  providers: [
    FinancialServiceProvidersService,
    FinancialServiceProviderQuestionRepository,
    FinancialServiceProviderRepository,
  ],
  controllers: [FinancialServiceProvidersController],
  exports: [
    FinancialServiceProvidersService,
    FinancialServiceProviderQuestionRepository,
    FinancialServiceProviderRepository,
  ],
})
export class FinancialServiceProvidersModule {}
