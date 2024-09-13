import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { FinancialServiceProvidersController } from '@121-service/src/financial-service-providers/financial-service-provider.controller';
import { FinancialServiceProvidersService } from '@121-service/src/financial-service-providers/financial-service-provider.service';
import { UserModule } from '@121-service/src/user/user.module';

@Module({
  imports: [HttpModule, UserModule],
  providers: [FinancialServiceProvidersService],
  controllers: [FinancialServiceProvidersController],
  exports: [FinancialServiceProvidersService],
})
export class FinancialServiceProvidersModule {}
