import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';

import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-approve-payment',
  imports: [ButtonModule, FormDialogComponent, DataListComponent],
  templateUrl: './approve-payment.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApprovePaymentComponent {
  readonly rtlHelper = inject(RtlHelperService);
  readonly programId = input.required<string>();
  readonly paymentId = input.required<string>();
  readonly fspList = input.required<string>();
  readonly transactionCount = input.required<string>();
  readonly totalPaymentAmount = input.required<string>();
  readonly approvedBadgeLabel = input.required<string>();

  private paymentApiService = inject(PaymentApiService);
  private toastService = inject(ToastService);

  readonly approvePaymentDialog = viewChild.required<FormDialogComponent>(
    'approvePaymentDialog',
  );

  private readonly note = signal('');
  approvePaymentMutation = injectMutation(() => ({
    mutationFn: () =>
      this.paymentApiService.approvePayment({
        programId: this.programId,
        paymentId: this.paymentId,
        note: this.note,
      }),
    onSuccess: () => {
      this.approvePaymentDialog().hide();
      this.toastService.showToast({
        detail: $localize`Payment approved successfully.`,
      });
    },
  }));

  readonly dataList = computed<DataListItem[]>(() => [
    {
      label: $localize`Approvals`,
      type: 'text',
      chipLabel: this.approvedBadgeLabel(),
      chipVariant: 'orange',
    },
    {
      label: $localize`Financial Service Provider(s)`,
      value: this.fspList(),
      type: 'text',
    },
    {
      label: $localize`Total registrations`,
      type: 'text',
      chipLabel: this.transactionCount(),
      chipVariant: 'blue',
    },
    {
      label: $localize`Total amount`,
      value: this.totalPaymentAmount(),
      type: 'text',
    },
    {
      label: $localize`Add note`,
      type: 'input',
      inputValue: this.note(),
      inputPlaceholder: $localize`Optional`,
      inputChange: (value: string) => {
        this.note.set(value);
      },
    },
  ]);

  openApprovePaymentDialog() {
    this.approvePaymentDialog().show();
  }
}
