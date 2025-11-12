import { Test, TestingModule } from '@nestjs/testing';

import { RegistrationDebitCardsController } from '@121-service/src/registration-debit-cards/registration-debit-cards.controller';

describe('RegistrationDebitCardsController', () => {
  let controller: RegistrationDebitCardsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrationDebitCardsController],
    }).compile();

    controller = module.get<RegistrationDebitCardsController>(
      RegistrationDebitCardsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
