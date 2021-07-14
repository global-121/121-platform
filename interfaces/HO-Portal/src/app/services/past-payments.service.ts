import { Injectable } from '@angular/core';
import { InstallmentData } from '../models/installment.model';
import { ProgramsServiceApiService } from './programs-service-api.service';

@Injectable({
  providedIn: 'root',
})
export class PastPaymentsService {
  constructor(private programsService: ProgramsServiceApiService) {}

  public async getLastInstallmentId(
    programId: number | string,
    pastPayments?: InstallmentData[],
  ): Promise<number> {
    if (!pastPayments) {
      pastPayments = await this.programsService.getPastInstallments(programId);
    }
    if (pastPayments.length === 0) {
      return 0;
    }
    return pastPayments[pastPayments.length - 1].id;
  }

  public async getInstallmentsWithDates(programId: number): Promise<
    {
      id: number;
      date: Date | string;
    }[]
  > {
    const installments = await this.programsService.getPastInstallments(
      programId,
    );
    return installments
      .sort((a, b) => (a.id < b.id ? 1 : -1))
      .map((installment) => {
        return {
          id: installment.id,
          date: installment.installmentDate,
        };
      });
  }

  // To be used for metrics year-month dropdown
  public async getInstallmentYearMonths(programId: number): Promise<
    {
      label: string;
      value: string;
    }[]
  > {
    const installments = await this.programsService.getPastInstallments(
      programId,
    );
    const yearMonths: {
      label: string;
      value: string;
    }[] = [];
    installments.map((installment) => {
      const date = new Date(installment.installmentDate);
      const monthOneDigit = String(date.getMonth()).length === 1;
      const yearMonth = {
        label:
          date.getFullYear() +
          '-' +
          (monthOneDigit ? '0' : '') +
          (date.getMonth() + 1),
        value: 'year=' + date.getFullYear() + '&month=' + date.getMonth(),
      };
      if (
        !yearMonths
          .map((ym) => JSON.stringify(ym))
          .includes(JSON.stringify(yearMonth))
      ) {
        yearMonths.push(yearMonth);
      }
    });
    return yearMonths.sort((a, b) => (a.label < b.label ? 1 : -1));
  }
}
