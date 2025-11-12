import { Test, TestingModule } from '@nestjs/testing';

import { RegistrationDebitCardsService } from '@121-service/src/registration-debit-cards/registration-debit-cards.service';

describe('RegistrationDebitCardsService', () => {
  let service: RegistrationDebitCardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegistrationDebitCardsService],
    }).compile();

    service = module.get<RegistrationDebitCardsService>(
      RegistrationDebitCardsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
