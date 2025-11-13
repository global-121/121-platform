import { Module } from '@nestjs/common';

import { MessageQueuesModule } from '@121-service/src/notifications/message-queues/message-queues.module';
import { IntersolveVisaModule } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationDebitCardsController } from '@121-service/src/registration-debit-cards/registration-debit-cards.controller';
import { RegistrationDebitCardsService } from '@121-service/src/registration-debit-cards/registration-debit-cards.service';
import { UserModule } from '@121-service/src/user/user.module';

@Module({
  imports: [
    MessageQueuesModule,
    IntersolveVisaModule,
    ProgramFspConfigurationsModule,
    RegistrationDataModule,
    UserModule,
  ],
  controllers: [RegistrationDebitCardsController],
  providers: [RegistrationDebitCardsService, RegistrationScopedRepository],
  exports: [RegistrationDebitCardsService],
})
export class RegistrationDebitCardsModule {}
