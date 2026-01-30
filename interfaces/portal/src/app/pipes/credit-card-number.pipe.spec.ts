import { TestBed } from '@angular/core/testing';

import { CreditCardNumberPipe } from '~/pipes/credit-card-number.pipe';

describe('CreditCardNumberPipe', () => {
  let pipe: CreditCardNumberPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CreditCardNumberPipe],
    });
    pipe = TestBed.inject(CreditCardNumberPipe);
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('null defaults to empty string', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('undefined defaults to empty string', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  describe('when it gets a non-number string it should return the input value', () => {
    it('for regular strings', () => {
      expect(pipe.transform('Test-card')).toBe('Test-card');
    });

    it('for empty strings', () => {
      expect(pipe.transform('')).toBe('');
    });

    it('when first character is zero, it is preserved', () => {
      expect(pipe.transform('010')).toBe('010');
    });
  });

  describe('when it gets a number string', () => {
    it('should return a dashed credit card number', () => {
      const creditCard19Digits = '1234567890123456789';
      expect(pipe.transform(creditCard19Digits)).toBe(
        '1234-5678-9012-3456-789',
      );
    });

    it('does not dash a short number', () => {
      expect(pipe.transform('1234')).toBe('1234');
    });

    it('starts adding dashes to numbers of length greater than 4', () => {
      expect(pipe.transform('12345')).toBe('1234-5');
    });

    it('numbers in exponential notation are treated as strings', () => {
      expect(pipe.transform('1.23456e+5')).toBe('1.23-456e-+5');
    });
  });
});
