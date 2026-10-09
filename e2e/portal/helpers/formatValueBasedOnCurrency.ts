import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';

export const formatValueBasedOnCurrency = ({
  value,
  currency,
}: {
  value: string;
  currency: CurrencyCode;
}) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).format(Number(value));
};
