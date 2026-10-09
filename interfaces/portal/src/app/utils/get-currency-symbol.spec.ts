import { afterEach, describe, expect, it, vi } from 'vitest';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';

import { getCurrencySymbol } from '~/utils/get-currency-symbol';

describe('getCurrencySymbol', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockFormatToParts = ({
    parts,
  }: {
    parts: Intl.NumberFormatPart[];
  }): void => {
    vi.spyOn(Intl.NumberFormat.prototype, 'formatToParts').mockReturnValue(
      parts,
    );
  };

  it('should return the currency symbol when it is supported', () => {
    expect(getCurrencySymbol({ code: CurrencyCode.EUR })).toBe('€');
  });

  it('should return the currency code when no currency part is found', () => {
    mockFormatToParts({ parts: [{ type: 'integer', value: '0' }] });

    expect(getCurrencySymbol({ code: CurrencyCode.EUR })).toBe(
      CurrencyCode.EUR,
    );
  });

  it('should return the currency code when the symbol is the Som sign without font support', () => {
    mockFormatToParts({ parts: [{ type: 'currency', value: '\u20C0' }] });

    expect(getCurrencySymbol({ code: CurrencyCode.KGS })).toBe(
      CurrencyCode.KGS,
    );
  });

  it('should return the currency code when the symbol is a zero-width space', () => {
    mockFormatToParts({ parts: [{ type: 'currency', value: '\u200B' }] });

    expect(getCurrencySymbol({ code: CurrencyCode.EUR })).toBe(
      CurrencyCode.EUR,
    );
  });
});
