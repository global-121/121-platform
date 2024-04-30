import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { FinancialServiceProviderController } from './financial-service-provider.controller';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { FinancialServiceProviderService } from './financial-service-provider.service';
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
  providers: [FinancialServiceProviderService],
  controllers: [FinancialServiceProviderController],
  exports: [FinancialServiceProviderService],
})
export class FinancialServiceProviderModule {}
