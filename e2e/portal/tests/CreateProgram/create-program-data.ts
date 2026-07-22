import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';

import { getFspLabels } from '@121-e2e/portal/helpers/get-fsp-labels';

export const createProgramInfo = (): ProgramInfo => {
  const todayDate = new Date();
  const futureDate = new Date(todayDate);
  futureDate.setDate(futureDate.getDate() + 1);

  return {
    name: 'TUiR Warta',
    description: 'TUiR Warta description',
    dateRange: { start: todayDate, end: futureDate },
    location: 'Polen',
    targetRegistrations: '200',
    fundsAvailable: '200',
    currency: CurrencyCode.CAD,
    paymentFrequency: '2-months',
    defaultNumberOfTransactions: '5',
    fixedTransferValue: '100',
    fsps: getFspLabels({
      fsps: [Fsps.intersolveVisa, Fsps.intersolveVoucherPaper, Fsps.safaricom],
    }),
  };
};

export interface ProgramInfo {
  name: string;
  description: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  location: string;
  targetRegistrations: string;
  fundsAvailable: string;
  currency: CurrencyCode;
  paymentFrequency: string;
  defaultNumberOfTransactions: string;
  fixedTransferValue: string;
  fsps: string[];
}
