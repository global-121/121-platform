import { TestBed } from '@automock/jest';
import { IntersolveVisaWalletEntity } from './intersolve-visa-wallet.entity';

const expectedCalculatedAmount = 10;

describe('IntersolveVisaWalletEntity', () => {
  let intersolveVisaWalletEntity: IntersolveVisaWalletEntity;

  beforeEach(() => {
    const { unit } = TestBed.create(IntersolveVisaWalletEntity).compile();

    intersolveVisaWalletEntity = unit;
  });

  it('should correctly calculate top up amount', () => {
    intersolveVisaWalletEntity.spentThisMonth = 10000;
    intersolveVisaWalletEntity.balance = 4000;

    // Act
    const calculatedAmount = intersolveVisaWalletEntity.calculateTopUpAmount();
    // Assert
    expect(calculatedAmount).toBe(expectedCalculatedAmount);
  });
});
