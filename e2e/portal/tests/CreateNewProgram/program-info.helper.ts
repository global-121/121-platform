import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
const todaysDate = new Date();
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 1);

export interface ProgramInfo {
  name: string;
  description: string;
  dateRange: { start: Date; end: Date };
  location: string;
  targetRegistrations: string;
  fundsAvailable: string;
  currency: CurrencyCode;
  paymentFrequency: string;
  defaultNrOfTransactions: string;
  fixedTransferValue: string;
  fsps?: string[];
}

export const getProgramInfo = ({
  fsps,
}: { fsps?: string[] } = {}): ProgramInfo => {
  const details = {
    name: 'TUiR Warta',
    description: 'TUiR Warta description',
    dateRange: { start: todaysDate, end: futureDate },
    location: 'Polen',
    targetRegistrations: '200',
    fundsAvailable: '200',
    currency: CurrencyCode.CAD,
    paymentFrequency: '2-months',
    defaultNrOfTransactions: '5',
    fixedTransferValue: '100',
  };

  if (fsps) {
    return {
      ...details,
      fsps: fsps.filter((fsp): fsp is string => fsp !== undefined),
    };
  }

  return details;
};
