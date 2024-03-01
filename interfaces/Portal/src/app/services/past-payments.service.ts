import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PaymentData, PaymentRowDetail } from '../models/payment.model';
import { Person } from '../models/person.model';
import { Program } from '../models/program.model';
import {
  RegistrationActivity,
  RegistrationActivityType,
} from '../models/registration-activity.model';
import { StatusEnum } from '../models/status.enum';
import { PaymentUtils } from '../shared/payment.utils';
import { ProgramsServiceApiService } from './programs-service-api.service';

@Injectable({
  providedIn: 'root',
})
export class PastPaymentsService {
  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
  ) {}

  public async getLastPaymentId(
    programId: number | string,
    pastPayments?: PaymentData[],
  ): Promise<number> {
    if (!pastPayments) {
      pastPayments = await this.programsService.getPastPayments(programId);
    }
    if (!pastPayments || pastPayments.length === 0) {
      return 0;
    }
    return pastPayments[pastPayments.length - 1].id;
  }

  public async getNextPaymentId(program: Program): Promise<number> {
    const lastPaymentId = await this.getLastPaymentId(program.id);
    return lastPaymentId < program.distributionDuration ? lastPaymentId + 1 : 0;
  }

  public async getPaymentsWithDates(programId: number): Promise<
    {
      id: number;
      date: Date | string;
    }[]
  > {
    const payments = await this.programsService.getPastPayments(programId);
    return payments
      .sort((a, b) => (a.id < b.id ? 1 : -1))
      .map((payment) => ({
        id: payment.id,
        date: payment.paymentDate,
      }));
  }

  public async getPaymentYearMonths(programId: number): Promise<
    {
      date: Date | string;
    }[]
  > {
    const payments = await this.getPaymentsWithDates(programId);
    const yearMonths: {
      label: string;
      date: Date | string;
    }[] = payments.map((payment) => {
      const date = new Date(payment.date);
      const yearMonth = {
        label: `${date.getFullYear()}-${date.getMonth()}`,
        date,
      };
      return yearMonth;
    });
    // Filter for only unique months
    return yearMonths.filter(
      (value, index, self) =>
        self.indexOf(self.find((item) => item.label === value.label)) === index,
    );
  }

  public async getPaymentsWithStateSums(programId: number): Promise<
    {
      id: number;
      values: {
        [state: string]: number;
      };
    }[]
  > {
    return this.programsService.getPaymentsWithStateSums(programId);
  }

  public async getPaymentActivity(
    program: Program,
    person: Person,
    canDoSinglePayment: boolean,
  ): Promise<RegistrationActivity[]> {
    const paymentActivity = [];
    const nrOfPayments = program?.distributionDuration;
    const lastPaymentToShow = Math.min(
      await this.getLastPaymentId(program.id),
      nrOfPayments,
    );
    const transactions = await this.programsService.getTransactions(
      program.id,
      person.referenceId,
    );
    const lastPaymentId = await this.getLastPaymentId(program.id);
    for (let index = 1; index <= lastPaymentToShow; index++) {
      const transaction = PaymentUtils.getTransactionOfPaymentForRegistration(
        index,
        person.referenceId,
        transactions,
      );
      let paymentRowValue: PaymentRowDetail = {
        paymentIndex: index,
        text: '',
      };
      if (!transaction) {
        paymentRowValue.text = this.translate.instant(
          'page.program.program-people-affected.transaction.do-single-payment',
        );
        paymentRowValue.status = StatusEnum.notYetSent;
      } else {
        paymentRowValue = PaymentUtils.getPaymentRowInfo(
          transaction,
          program,
          index,
        );
        if (transaction.status === StatusEnum.success) {
          /* empty */
        } else if (transaction.status === StatusEnum.waiting) {
          paymentRowValue.errorMessage = this.translate.instant(
            'page.program.program-people-affected.transaction.waiting-message',
          );
          paymentRowValue.waiting = true;
        } else {
          paymentRowValue.errorMessage = transaction.errorMessage;
        }

        paymentRowValue.status = transaction.status;
      }
      if (
        paymentRowValue.transaction ||
        PaymentUtils.enableSinglePayment(
          paymentRowValue,
          canDoSinglePayment,
          person.status,
          lastPaymentId,
          false,
        )
      ) {
        paymentActivity.push({
          paymentRowDetail: { ...paymentRowValue },
          type: RegistrationActivityType.payment,
          date: paymentRowValue.sentDate
            ? new Date(paymentRowValue.sentDate)
            : null,
          label: this.translate.instant(
            'registration-details.payment-history.transfer',
            { paymentNr: paymentRowValue.paymentIndex },
          ),
          user: paymentRowValue.transaction?.user.username,
          activityStatus: paymentRowValue.status,
        });
      }
    }
    return paymentActivity;
  }
}
