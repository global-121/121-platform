import { Module } from '@nestjs/common';

import { DebitCardsIntersolveVisaController } from '@121-service/src/debit-cards-intersolve-visa/debit-cards-intersolve-visa.controller';
import { DebitCardsIntersolveVisaService } from '@121-service/src/debit-cards-intersolve-visa/debit-cards-intersolve-visa.service';
import { MessageQueuesModule } from '@121-service/src/notifications/message-queues/message-queues.module';
import { IntersolveVisaModule } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { UserModule } from '@121-service/src/user/user.module';

@Module({
  imports: [
    MessageQueuesModule,
    IntersolveVisaModule,
    ProgramFspConfigurationsModule,
    RegistrationDataModule,
    UserModule,
  ],
  controllers: [DebitCardsIntersolveVisaController],
  providers: [DebitCardsIntersolveVisaService, RegistrationScopedRepository],
  exports: [DebitCardsIntersolveVisaService],
})
export class DebitCardsIntersolveVisaModule {}
