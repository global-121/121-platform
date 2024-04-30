import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { FspQuestionEntity } from './fsp-question.entity';
import { FinancialServiceProviderController } from './financial-service-provider.controller';
import { FinancialServiceProviderService } from './financial-service-provider.service';

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
