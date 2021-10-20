import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { FspAttributeEntity } from './fsp-attribute.entity';
import { FspController } from './fsp.controller';
import { FspService } from './fsp.service';

@Module({
  imports: [
    HttpModule,
    UserModule,
    TypeOrmModule.forFeature([
      FinancialServiceProviderEntity,
      FspAttributeEntity,
      UserEntity,
    ]),
  ],
  providers: [FspService],
  controllers: [FspController],
  exports: [FspService],
})
export class FspModule {}
