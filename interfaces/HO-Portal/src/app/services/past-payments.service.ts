import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { InstallmentData } from '../models/installment.model';
import { ProgramsServiceApiService } from './programs-service-api.service';

@Injectable({
  providedIn: 'root',
})
export class PastPaymentsService {
  private locale: string;
  constructor(private programsService: ProgramsServiceApiService) {
    this.locale = environment.defaultLocale;
  }

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

  // To be used for metrics installment dropdown
  public async getInstallmentsForDropdown(programId: number): Promise<
    {
      label: string;
      value: string;
    }[]
  > {
    const installments = await this.programsService.getPastInstallments(
      programId,
    );
    return installments
      .sort((a, b) => (a.id < b.id ? 1 : -1))
      .map((i) => {
        return {
          label:
            'Payment #' +
            i.id +
            ' - ' +
            formatDate(i.installmentDate, 'dd-MM-yyyy', this.locale),
          value: 'installment=' + i.id,
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
