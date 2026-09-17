import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { isObject } from 'radashi';

import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import { isErrorWithStatusCode } from '~/utils/is-error-with-status-code.helper';

@Component({
  selector: 'app-start-payment',
  imports: [ButtonModule, FormDialogComponent, DataListComponent, DialogModule],
  templateUrl: './start-payment.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartPaymentComponent {
  readonly rtlHelper = inject(RtlHelperService);
  readonly programId = input.required<string>();
  readonly paymentId = input.required<string>();
  readonly fspList = input.required<string>();
  readonly transactionCount = input.required<string>();
  readonly totalPaymentAmount = input.required<string>();

  private paymentApiService = inject(PaymentApiService);
  private toastService = inject(ToastService);

  readonly duplicateErrorDialogVisible = model(false);
  readonly duplicateCount = signal(0);

  readonly startPaymentDialog =
    viewChild.required<FormDialogComponent>('startPaymentDialog');

  startPaymentMutation = injectMutation(() => ({
    mutationFn: () =>
      this.paymentApiService.startPayment({
        programId: this.programId,
        paymentId: this.paymentId,
      }),
    meta: { invalidateCacheAgainAfterDelay: 1000 },
    onSuccess: () => {
      this.startPaymentDialog().hide();
      this.toastService.showToast({
        detail: $localize`Payment started successfully.`,
      });
    },
    onError: (error) => {
      if (
        !isErrorWithStatusCode({
          error,
          statusCode: HttpStatusCode.BadRequest,
        })
      ) {
        return;
      }

      const cause = error.cause as HttpErrorResponse;

      if (!isObject(cause.error) || !('duplicateCount' in cause.error)) {
        return;
      }

      const errorObject = cause.error as {
        message: string;
        duplicateCount: number;
      };

      this.duplicateCount.set(errorObject.duplicateCount);
      this.startPaymentDialog().hide();
      this.startPaymentMutation.reset();
      this.duplicateErrorDialogVisible.set(true);
    },
  }));

  readonly dataList = computed<DataListItem[]>(() => [
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

  openStartPaymentDialog() {
    this.startPaymentDialog().show();
  }
}
