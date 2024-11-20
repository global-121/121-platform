import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
  ViewChild,
} from '@angular/core';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Dialog, DialogModule } from 'primeng/dialog';
import { MenuModule } from 'primeng/menu';

import { BulkActionResultPaymentDto } from '@121-service/src/registration/dto/bulk-action-result.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { FullscreenSpinnerComponent } from '~/components/fullscreen-spinner/fullscreen-spinner.component';
import { RegistrationsTableComponent } from '~/components/registrations-table/registrations-table.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { getNextPaymentId } from '~/domains/payment/payment.helpers';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { PaginateQuery } from '~/services/paginate-query.service';
import { ToastService } from '~/services/toast.service';
import { Dto } from '~/utils/dto-type';

@Component({
  selector: 'app-create-payment',
  standalone: true,
  imports: [
    ButtonModule,
    DialogModule,
    DatePipe,
    RegistrationsTableComponent,
    CardModule,
    NgClass,
    DataListComponent,
    FullscreenSpinnerComponent,
    MenuModule,
  ],
  templateUrl: './create-payment.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CurrencyPipe, ToastService],
})
export class CreatePaymentComponent {
  projectId = input.required<number>();

  currencyPipe = inject(CurrencyPipe);
  toastService = inject(ToastService);
  paymentApiService = inject(PaymentApiService);
  projectApiService = inject(ProjectApiService);

  @ViewChild('createPaymentDialog')
  createPaymentDialog: Dialog;
  @ViewChild('registrationsTable')
  registrationsTable: RegistrationsTableComponent | undefined;

  dialogVisible = model(false);
  dryRunResult = signal<Dto<BulkActionResultPaymentDto> | undefined>(undefined);

  today = new Date();
  totalSteps = 2;
  overrideFilters = {
    // only registrations with status "included" are eligible for payment
    status: RegistrationStatusEnum.included,
  };

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  payments = injectQuery(this.paymentApiService.getPayments(this.projectId));
  paymentInProgress = injectQuery(
    this.paymentApiService.getPaymentStatus(this.projectId),
  );

  nextPaymentId = computed(() => {
    const payments = this.payments.data();

    if (!payments) {
      return -1;
    }

    return getNextPaymentId(payments);
  });

  paymentAmount = computed(() => this.project.data()?.fixedTransferValue ?? 0);

  createPaymentMutation = injectMutation(() => ({
    mutationFn: ({
      dryRun,
      paginateQuery,
    }: {
      dryRun: boolean;
      paginateQuery: PaginateQuery;
    }) =>
      this.paymentApiService.createPayment({
        projectId: this.projectId,
        paginateQuery,
        paymentData: {
          payment: this.nextPaymentId(),
          amount: this.paymentAmount(),
        },
        dryRun,
      }),
    onSuccess: (result, { dryRun }) => {
      if (result.nonApplicableCount > 0) {
        throw new Error(
          $localize`Some of the registrations you have selected are not eligible for this payment. Change your selection and try again`,
        );
      }

      if (dryRun) {
        this.dryRunResult.set(result);
        return;
      }

      this.dialogVisible.set(false);

      this.toastService.showToast({
        detail: $localize`Payment created.`,
      });

      void this.paymentApiService.invalidateCache(this.projectId);

      setTimeout(() => {
        // invalidate the cache again after a delay to try and make the payments change reflected in the UI
        void this.paymentApiService.invalidateCache(this.projectId);
      }, 500);
    },
    onError: (error) => {
      this.toastService.showToast({
        severity: 'error',
        detail: error.message,
      });
    },
  }));

  openDialog() {
    if (!this.paymentInProgress.isSuccess()) {
      return;
    }

    if (this.paymentInProgress.data().inProgress) {
      this.toastService.showToast({
        severity: 'warn',
        detail: $localize`A payment is currently in progress. Please wait until it has finished.`,
      });
      return;
    }

    this.dryRunResult.set(undefined);
    this.registrationsTable?.resetSelection();
    this.dialogVisible.set(true);
    this.createPaymentDialog.maximize();
  }

  currentStep = computed(() => (this.dryRunResult() ? 2 : 1));

  createPayment() {
    const actionData = this.registrationsTable?.getActionData();

    if (!actionData) {
      return;
    }

    this.createPaymentMutation.mutate({
      dryRun: this.currentStep() === 1,
      paginateQuery: actionData.query,
    });
  }

  paymentSummaryData = computed(() => {
    const dryRunResult = this.dryRunResult();

    if (!dryRunResult) {
      return [];
    }

    const listData: DataListItem[] = [
      {
        label: $localize`Financial Service Provider(s)`,
        value: dryRunResult.fspsInPayment.join(', '),
        fullWidth: true,
      },
      {
        label: $localize`Registrations`,
        value: dryRunResult.applicableCount.toString(),
      },
      {
        label: $localize`Total payment amount`,
        value: this.currencyPipe.transform(
          this.paymentAmount() * dryRunResult.sumPaymentAmountMultiplier,
          this.project.data()?.currency ?? 'EUR',
          'symbol-narrow',
          '1.0-0',
        ),
        tooltip: $localize`The total payment amount is calculated by summing up the transfer values of each included registration added to the payment.`,
      },
    ];

    return listData;
  });

  paymentSummaryMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`Export payment list`,
      icon: 'pi pi-upload',
      command: () => {
        // TODO: AB#31502
        this.toastService.showToast({
          severity: 'warn',
          detail: "Haven't implemented this yet 😵‍💫",
        });
      },
    },
  ]);

  proceedLabel = computed(() =>
    this.currentStep() === 1
      ? $localize`Add to payment`
      : $localize`Start payment`,
  );

  cannotProceed = computed(
    () =>
      this.createPaymentMutation.isPending() ||
      this.project.isPending() ||
      this.paymentInProgress.isPending(),
  );
}
