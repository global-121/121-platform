import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';

@Component({
  selector: 'app-colored-chip-payment-approval-status',
  imports: [ColoredChipComponent],
  templateUrl: './colored-chip-payment-approval-status.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColoredChipPaymentApprovalStatusComponent {
  readonly programId = input.required<string>();
  readonly paymentId = input.required<number | string>();
  private paymentApiService = inject(PaymentApiService);

  paymentStatus = injectQuery(
    this.paymentApiService.getPaymentStatus(this.programId),
  );

  payment = injectQuery(() => ({
    ...this.paymentApiService.getPayment({
      programId: this.programId,
      paymentId: this.paymentId,
    })(),
  }));

  readonly isPaymentApproved = computed(() => {
    if (!this.payment.isSuccess()) {
      return false;
    }

    const data = this.payment.data();

    const failed = data.failed.count;
    const success = data.success.count;
    const waiting = data.waiting.count;
    const approved = data.approved.count;

    return failed + success + waiting + approved > 0;
  });

  readonly label = computed(() => {
    if (!this.payment.isSuccess()) {
      return '';
    }

    if (this.isPaymentApproved()) {
      return $localize`Approved`;
    }

    const approvalData = this.payment.data().approvalStatus;
    const approvedCount = approvalData.filter((status) => status.approved);
    const totalCount = approvalData.length;

    return $localize`${approvedCount.length} of ${totalCount} approved`;
  });

  readonly variant = computed(() => {
    if (!this.payment.isSuccess()) {
      return 'blue';
    }

    if (this.isPaymentApproved()) {
      return 'purple';
    }

    return 'orange';
  });
}
