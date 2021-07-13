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

  // To be used for metrics installment dropdown
  public async getInstallmentIds(programId: number): Promise<number[]> {
    const installments = await this.programsService.getPastInstallments(
      programId,
    );
    return installments.map((i) => i.id).sort((a, b) => (a < b ? 1 : -1));
  }

  // To be used for metrics year-month dropdown
  public async getInstallmentYearMonths(programId: number): Promise<string[]> {
    const installments = await this.programsService.getPastInstallments(
      programId,
    );
    const yearMonths: string[] = [];
    installments.forEach((installment) => {
      const date = new Date(installment.installmentDate);
      const yearMonth = date.getFullYear() + '-' + (date.getMonth() + 1);
      if (!yearMonths.includes(yearMonth)) {
        yearMonths.push(yearMonth);
      }
    });
    return yearMonths.sort((a, b) => (a < b ? 1 : -1));
  }
}
