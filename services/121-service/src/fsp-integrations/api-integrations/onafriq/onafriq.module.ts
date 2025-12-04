import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OnafriqTransactionEntity } from '@121-service/src/fsp-integrations/api-integrations/onafriq/entities/onafriq-transaction.entity';
import { OnafriqController } from '@121-service/src/fsp-integrations/api-integrations/onafriq/onafriq.controller';
import { OnafriqApiHelperService } from '@121-service/src/fsp-integrations/api-integrations/onafriq/services/onafriq.api.helper.service';
import { OnafriqApiService } from '@121-service/src/fsp-integrations/api-integrations/onafriq/services/onafriq.api.service';
import { OnafriqService } from '@121-service/src/fsp-integrations/api-integrations/onafriq/services/onafriq.service';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([OnafriqTransactionEntity]),
    RedisModule,
    QueuesRegistryModule,
    ProgramFspConfigurationsModule,
  ],
  providers: [
    OnafriqService,
    OnafriqApiService,
    OnafriqApiHelperService,
    CustomHttpService,
  ],
  exports: [OnafriqService],
  controllers: [OnafriqController],
})
export class OnafriqModule {}
