import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { FinancialServiceProviderAttributeEntity } from './financial-service-provider-attribute.entity';
import { FinancialServiceProviderController } from './financial-service-providers.controller';
import { FinancialServiceProvidersService } from './financial-service-providers.service';

@Module({
  imports: [
    HttpModule,
    UserModule,
    TypeOrmModule.forFeature([
      FinancialServiceProviderEntity,
      FinancialServiceProviderAttributeEntity,
    ]),
  ],
  providers: [FinancialServiceProvidersService],
  controllers: [FinancialServiceProviderController],
  exports: [FinancialServiceProvidersService],
})
export class FinancialServiceProvidersModule {}
