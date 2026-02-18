import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { CardSummaryMetricsContainerComponent } from '~/components/card-summary-metrics-container/card-summary-metrics-container.component';
import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { ColoredChipPaymentApprovalStatusComponent } from '~/components/colored-chip-payment-approval-status/colored-chip-payment-approval-status.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { paymentLink } from '~/domains/payment/payment.helpers';
import { PaymentAggregationSummary } from '~/domains/payment/payment.model';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { Locale } from '~/utils/locale';

@Component({
  selector: 'app-payment-summary-card',
  imports: [
    CardWithLinkComponent,
    CardSummaryMetricsContainerComponent,
    ColoredChipPaymentApprovalStatusComponent,
  ],
  providers: [CurrencyPipe, DecimalPipe],
  templateUrl: './payment-summary-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentSummaryCardComponent {
  private locale = inject<Locale>(LOCALE_ID);
  private paymentApiService = inject(PaymentApiService);
  private currencyPipe = inject(CurrencyPipe);
  private decimalPipe = inject(DecimalPipe);
  private programApiService = inject(ProgramApiService);

  readonly programId = input.required<string>();
  readonly paymentId = input.required<number>();
  readonly paymentDate = input.required<string>();
  readonly cardIndex = input.required<number>();
  readonly paymentData = input.required<PaymentAggregationSummary>();

  program = injectQuery(this.programApiService.getProgram(this.programId));
  paymentStatus = injectQuery(
    this.paymentApiService.getPaymentStatus(this.programId),
  );

  // Only fetch live data for the latest payment when payment is in progress
  latestPayment = injectQuery(() => ({
    ...this.paymentApiService.getPaymentAggregationFull({
      programId: this.programId,
      paymentId: this.paymentId,
    })(),
    enabled: this.isLatestPayment(),
    refetchInterval:
      this.isLatestPayment() && this.paymentStatus.data()?.inProgress
        ? 1000
        : false,
  }));

  readonly isLatestPayment = computed(() => this.cardIndex() === 0);

  // Use live data for latest payment if available, otherwise use passed-in data
  readonly currentPaymentData = computed(() => {
    const latestPaymentData = this.latestPayment.data();
    return this.isLatestPayment() && latestPaymentData
      ? latestPaymentData
      : this.paymentData();
  });

  readonly includedRegistrations = computed(() => {
    const data = this.currentPaymentData();
    return (
      data.success.count +
      data.waiting.count +
      data.failed.count +
      data.pendingApproval.count
    );
  });

  readonly expectedAmount = computed(() => {
    const data = this.currentPaymentData();
    return (
      data.success.transferValue +
      data.waiting.transferValue +
      data.failed.transferValue +
      data.pendingApproval.transferValue
    );
  });

  readonly showFailedAlert = computed(
    () => this.currentPaymentData().failed.count > 0,
  );

  readonly successAmount = computed(
    () => this.currentPaymentData().success.transferValue,
  );

  readonly paymentLink = computed(() =>
    paymentLink({ programId: this.programId(), paymentId: this.paymentId() }),
  );

  readonly paymentCreationDate = computed(
    () =>
      new DatePipe(this.locale).transform(this.paymentDate(), 'short') ?? '',
  );

  readonly paymentTitle = computed(
    () =>
      $localize`:@@page-title-program-payment:Payment` +
      ' ' +
      this.paymentCreationDate(),
  );

  public readonly summaryMetrics = computed(() => [
    {
      value: this.decimalPipe.transform(this.includedRegistrations()),
      label: $localize`Included reg.`,
    },
    {
      value: this.currencyPipe.transform(
        this.expectedAmount(),
        this.program.data()?.currency,
        'symbol-narrow',
        '1.2-2',
      ),
      label: $localize`Expected total amount`,
    },
    {
      value: this.decimalPipe.transform(this.currentPaymentData().failed.count),
      label: $localize`Failed transactions`,
      showAlert: this.showFailedAlert(),
    },
    {
      value: this.currencyPipe.transform(
        this.successAmount(),
        this.program.data()?.currency,
        'symbol-narrow',
        '1.2-2',
      ),
      label: $localize`Amount successfully sent`,
    },
  ]);
}
