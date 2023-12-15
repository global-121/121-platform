import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { FspQuestionEntity } from './fsp-question.entity';
import { FspController } from './fsp.controller';
import { FspService } from './fsp.service';

@Module({
  imports: [
    HttpModule,
    UserModule,
    TypeOrmModule.forFeature([
      FinancialServiceProviderEntity,
      FspQuestionEntity,
    ]),
  ],
  providers: [FspService],
  controllers: [FspController],
  exports: [FspService],
})
export class FspModule {}
