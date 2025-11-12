import { Module } from '@nestjs/common';

import { RegistrationDebitCardsController } from '@121-service/src/registration-debit-cards/registration-debit-cards.controller';
import { RegistrationDebitCardsService } from '@121-service/src/registration-debit-cards/registration-debit-cards.service';

@Module({
  controllers: [RegistrationDebitCardsController],
  providers: [RegistrationDebitCardsService],
  exports: [RegistrationDebitCardsService],
})
export class RegistrationDebitCardsModule {}
