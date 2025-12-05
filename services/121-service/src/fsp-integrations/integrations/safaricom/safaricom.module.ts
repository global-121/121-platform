import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SafaricomTransferEntity } from '@121-service/src/fsp-integrations/integrations/safaricom/entities/safaricom-transfer.entity';
import { SafaricomTransferScopedRepository } from '@121-service/src/fsp-integrations/integrations/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomService } from '@121-service/src/fsp-integrations/integrations/safaricom/safaricom.service';
import { SafaricomApiHelperService } from '@121-service/src/fsp-integrations/integrations/safaricom/services/safaricom.api.helper.service';
import { SafaricomApiService } from '@121-service/src/fsp-integrations/integrations/safaricom/services/safaricom.api.service';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([SafaricomTransferEntity]),
    RedisModule,
    QueuesRegistryModule,
  ],
  providers: [
    SafaricomService,
    SafaricomApiService,
    SafaricomApiHelperService,
    TokenValidationService,
    CustomHttpService,
    SafaricomTransferScopedRepository,
  ],
  exports: [SafaricomService, SafaricomTransferScopedRepository],
})
export class SafaricomModule {}
