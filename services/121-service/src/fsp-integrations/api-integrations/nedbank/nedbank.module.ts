import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NedbankVoucherEntity } from '@121-service/src/fsp-integrations/api-integrations/nedbank/entities/nedbank-voucher.entity';
import { NedbankVoucherScopedRepository } from '@121-service/src/fsp-integrations/api-integrations/nedbank/repositories/nedbank-voucher.scoped.repository';
import { NedbankService } from '@121-service/src/fsp-integrations/api-integrations/nedbank/services/nedbank.service';
import { NedbankApiHelperService } from '@121-service/src/fsp-integrations/api-integrations/nedbank/services/nedbank-api.helper.service';
import { NedbankApiService } from '@121-service/src/fsp-integrations/api-integrations/nedbank/services/nedbank-api.service';
import { NedbankApiClientService } from '@121-service/src/fsp-integrations/api-integrations/nedbank/services/nedbank-api-client.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([NedbankVoucherEntity])],
  providers: [
    NedbankService,
    NedbankApiService,
    CustomHttpService,
    NedbankVoucherScopedRepository,
    NedbankApiHelperService,
    NedbankApiClientService,
  ],
  exports: [NedbankService, NedbankVoucherScopedRepository],
})
export class NedbankModule {}
