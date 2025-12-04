import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommercialBankEthiopiaController } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/commercial-bank-ethiopia.controller';
import { CbeTransferScopedRepository } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/commercial-bank-ethiopia.scoped.repository';
import { CommercialBankEthiopiaAccountEnquiriesEntity } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/commercial-bank-ethiopia-account-enquiries.entity';
import { CbeTransferEntity } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/commercial-bank-ethiopia-transfer.entity';
import { CommercialBankEthiopiaApiService } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/services/commercial-bank-ethiopia.api.service';
import { CommercialBankEthiopiaService } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/services/commercial-bank-ethiopia.service';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { SoapService } from '@121-service/src/utils/soap/soap.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      ProgramFspConfigurationEntity,
      CbeTransferEntity,
    ]),
  ],
  providers: [
    CommercialBankEthiopiaService,
    CommercialBankEthiopiaApiService,
    SoapService,
    CustomHttpService,
    createScopedRepositoryProvider(
      CommercialBankEthiopiaAccountEnquiriesEntity,
    ),
    ProgramFspConfigurationRepository,
    CbeTransferScopedRepository,
  ],
  controllers: [CommercialBankEthiopiaController],
  exports: [
    CommercialBankEthiopiaApiService,
    CommercialBankEthiopiaService,
    CbeTransferScopedRepository,
  ],
})
export class CommercialBankEthiopiaModule {}
