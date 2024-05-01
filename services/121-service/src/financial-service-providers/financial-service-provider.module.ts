import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { FinancialServiceProvidersController } from './financial-service-provider.controller';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { FinancialServiceProvidersService } from './financial-service-provider.service';
import { FspQuestionEntity } from './fsp-question.entity';

@Module({
  imports: [
    HttpModule,
    UserModule,
    TypeOrmModule.forFeature([
      FinancialServiceProviderEntity,
      FspQuestionEntity,
    ]),
  ],
  providers: [FinancialServiceProvidersService],
  controllers: [FinancialServiceProvidersController],
  exports: [FinancialServiceProvidersService],
})
export class FinancialServiceProvidersModule {}
