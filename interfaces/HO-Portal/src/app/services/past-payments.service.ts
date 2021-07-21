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

  public async getInstallmentYearMonths(programId: number): Promise<
    {
      date: Date | string;
    }[]
  > {
    const installments = await this.getInstallmentsWithDates(programId);
    const yearMonths: {
      label: string;
      date: Date | string;
    }[] = installments.map((installment) => {
      const date = new Date(installment.date);
      const yearMonth = {
        label: `${date.getFullYear()}-${date.getMonth()}`,
        date,
      };
      return yearMonth;
    });
    // Filter for only unique months
    return yearMonths.filter((value, index, self) => {
      return (
        self.indexOf(self.find((item) => item.label === value.label)) === index
      );
    });
  }

  public async getInstallmentsWithStateSums(programId: number): Promise<
    {
      id: number;
      values: {
        [state: string]: number;
      };
    }[]
  > {
    const installments = await this.getInstallmentsWithDates(programId);

    const data = installments.map((payment) => {
      return {
        id: payment.id,
        values: {
          'pre-existing': this.getRandomInt(0, 100),
          new: this.getRandomInt(0, 100),
        },
      };
    });
    return data;
  }

  private getRandomInt(min: number, max: number): number {
    return (
      Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) +
      Math.ceil(min)
    );
  }
}
