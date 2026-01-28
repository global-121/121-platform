import { TestBed } from '@angular/core/testing';

import { CreditCardNumberPipe } from '~/pipes/credit-card-number.pipe';

describe('CreditCardNumberPipe', () => {
  let pipe: CreditCardNumberPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CreditCardNumberPipe],
    });
  });

  it('create an instance', () => {
    // Arrange
    pipe = TestBed.inject(CreditCardNumberPipe);
    expect(pipe).toBeTruthy();
  });

  it('should return a dashed credit card number when a number string is provided', () => {
    // Arrange
    pipe = TestBed.inject(CreditCardNumberPipe);
    const creditCard19Digits = '1234567890123456789';
    const expectedValue = '1234-5678-9012-3456-789';

    // Assert
    const dashedNumber = pipe.transform(creditCard19Digits);
    expect(dashedNumber).toBe(expectedValue);
  });

  it('should return the input value string is provided', () => {
    // Arrange
    pipe = TestBed.inject(CreditCardNumberPipe);
    const creditCardString = 'Test-card';
    const expectedValue = 'Test-card';

    // Assert
    const dashedNumber = pipe.transform(creditCardString);
    expect(dashedNumber).toBe(expectedValue);
  });
});
