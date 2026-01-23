import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';

type ApprovePaymentFormGroup =
  (typeof ApprovePaymentComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-approve-payment',
  imports: [
    ButtonModule,
    FormDialogComponent,
    DataListComponent,
    FormFieldWrapperComponent,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
  ],
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

  formGroup = new FormGroup({
    note: new FormControl<string | undefined>({
      value: undefined,
      disabled: false,
    }),
  });

  approvePaymentMutation = injectMutation(() => ({
    mutationFn: ({
      note,
    }: ReturnType<ApprovePaymentFormGroup['getRawValue']>) =>
      this.paymentApiService.approvePayment({
        programId: this.programId,
        paymentId: this.paymentId,
        note: note ?? undefined,
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
  ]);

  openApprovePaymentDialog() {
    this.approvePaymentDialog().show();
  }
}
