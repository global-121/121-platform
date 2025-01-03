import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Dialog, DialogModule } from 'primeng/dialog';
import { MenuModule } from 'primeng/menu';

import { FinancialServiceProviderIntegrationType } from '@121-service/src/financial-service-providers/financial-service-provider-integration-type.enum';
import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { BulkActionResultPaymentDto } from '@121-service/src/registration/dto/bulk-action-result.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import { AppRoutes } from '~/app.routes';
import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { getChipDataByRegistrationStatus } from '~/components/colored-chip/colored-chip.helper';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { FullscreenSpinnerComponent } from '~/components/fullscreen-spinner/fullscreen-spinner.component';
import { RegistrationsTableComponent } from '~/components/registrations-table/registrations-table.component';
import { FinancialServiceProviderConfigurationApiService } from '~/domains/financial-service-provider-configuration/financial-service-provider-configuration.api.service';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { getNextPaymentId } from '~/domains/payment/payment.helpers';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { financialServiceProviderConfigurationNamesHaveIntegrationType } from '~/domains/project/project.helper';
import { DownloadService } from '~/services/download.service';
import { ExportService } from '~/services/export.service';
import { PaginateQuery } from '~/services/paginate-query.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';
import { Dto } from '~/utils/dto-type';

const queryParamStep = 'create-payment-step';

@Component({
  selector: 'app-create-payment',
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
    ColoredChipComponent,
  ],
  templateUrl: './create-payment.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CurrencyPipe, ToastService],
})
export class CreatePaymentComponent {
  projectId = input.required<string>();

  currencyPipe = inject(CurrencyPipe);
  downloadService = inject(DownloadService);
  exportService = inject(ExportService);
  financialServiceProviderConfigurationApiService = inject(
    FinancialServiceProviderConfigurationApiService,
  );
  route = inject(ActivatedRoute);
  router = inject(Router);
  paymentApiService = inject(PaymentApiService);
  projectApiService = inject(ProjectApiService);
  toastService = inject(ToastService);
  translatableStringService = inject(TranslatableStringService);

  readonly createPaymentDialog = viewChild.required<Dialog>(
    'createPaymentDialog',
  );
  readonly registrationsTable =
    viewChild<RegistrationsTableComponent>('registrationsTable');

  dialogVisible = model(false);
  dryRunResult = signal<Dto<BulkActionResultPaymentDto> | undefined>(undefined);

  today = new Date();
  totalSteps = 2;
  overrideFilters = {
    // only registrations with status "included" are eligible for payment
    status: RegistrationStatusEnum.included,
  };
  includedChipData = getChipDataByRegistrationStatus(
    RegistrationStatusEnum.included,
  );

  financialServiceProviderConfigurations = injectQuery(
    this.financialServiceProviderConfigurationApiService.getFinancialServiceProviderConfigurations(
      this.projectId,
    ),
  );
  project = injectQuery(this.projectApiService.getProject(this.projectId));
  payments = injectQuery(this.paymentApiService.getPayments(this.projectId));
  paymentStatus = injectQuery(
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

  exportRegistrationsMutation = injectMutation(() => ({
    mutationFn: this.exportService.getExportListMutation(
      this.projectId,
      this.toastService,
    ),
    onSuccess: ({ exportResult: file, filename }) => {
      this.downloadService.downloadFile({ file, filename });
    },
  }));

  createPaymentMutation = injectMutation(() => ({
    mutationFn: async ({
      paymentId,
      dryRun,
      paginateQuery,
    }: {
      paymentId: number;
      dryRun: boolean;
      paginateQuery: PaginateQuery;
    }) => {
      const paymentResult = await this.paymentApiService.createPayment({
        projectId: this.projectId,
        paginateQuery,
        paymentData: {
          payment: paymentId,
          amount: this.paymentAmount(),
        },
        dryRun,
      });

      if (!dryRun) {
        // wait 1 second before resolving, to give the backend time to create at least one transaction in the DB
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      return paymentResult;
    },
    onSuccess: async (result, { dryRun, paymentId }) => {
      if (result.nonApplicableCount > 0) {
        throw new Error(
          $localize`Some of the registrations you have selected are not eligible for this payment. Change your selection and try again`,
        );
      }

      if (dryRun) {
        this.dryRunResult.set(result);
        return;
      }

      // Do not set dialogVisible to false here, otherwise the addCurrentStepToQueryParams
      // effect will be triggered, blocking the user from navigating away
      // this.dialogVisible.set(false);

      await this.paymentApiService.invalidateCache(
        this.projectId,
        signal(paymentId),
      );

      await this.router.navigate([
        '/',
        AppRoutes.project,
        this.projectId(),
        AppRoutes.projectPayments,
        paymentId,
      ]);

      this.toastService.showToast({
        detail: $localize`Payment created.`,
      });
    },
    onError: (error) => {
      this.toastService.showToast({
        severity: 'error',
        detail: error.message,
      });
    },
  }));

  openDialog() {
    if (this.paymentStatus.data()?.inProgress) {
      this.toastService.showToast({
        severity: 'warn',
        detail: $localize`A payment is currently in progress. Please wait until it has finished.`,
      });
      return;
    }

    this.dryRunResult.set(undefined);
    this.registrationsTable()?.resetSelection();
    this.dialogVisible.set(true);
    this.createPaymentDialog().maximize();
  }

  currentStep = computed(() => {
    if (!this.dialogVisible()) {
      return 0;
    }

    if (this.dryRunResult()) {
      return 2;
    }

    return 1;
  });

  goBack() {
    switch (this.currentStep()) {
      case 2:
        this.dryRunResult.set(undefined);
        break;
      case 1:
        this.dialogVisible.set(false);
        break;
    }
  }

  createPayment() {
    const actionData = this.registrationsTable()?.getActionData();

    if (!actionData) {
      return;
    }

    this.createPaymentMutation.mutate({
      dryRun: this.currentStep() === 1,
      paginateQuery: actionData.query,
      paymentId: this.nextPaymentId(),
    });
  }

  private paymentHasIntegrationType(
    integrationType: FinancialServiceProviderIntegrationType,
  ) {
    const project = this.project.data();
    const dryRunResult = this.dryRunResult();

    if (!project || !dryRunResult) {
      return false;
    }

    return financialServiceProviderConfigurationNamesHaveIntegrationType({
      project,
      financialServiceProviderConfigurationNames:
        dryRunResult.programFinancialServiceProviderConfigurationNames,
      integrationType,
    });
  }

  paymentHasIntegratedFsp = computed(() =>
    this.paymentHasIntegrationType(FinancialServiceProviderIntegrationType.api),
  );

  paymentHasExcelFsp = computed(() =>
    this.paymentHasIntegrationType(FinancialServiceProviderIntegrationType.csv),
  );

  paymentSummaryData = computed(() => {
    const dryRunResult = this.dryRunResult();

    if (!dryRunResult) {
      return [];
    }

    const listData: DataListItem[] = [
      {
        label: $localize`Financial Service Provider(s)`,
        value: dryRunResult.programFinancialServiceProviderConfigurationNames
          .map((paymentFspConfigName) => {
            const fspConfig = this.financialServiceProviderConfigurations
              .data()
              ?.find((fspConfig) => fspConfig.name === paymentFspConfigName);
            return (
              this.translatableStringService.translate(fspConfig?.label) ??
              paymentFspConfigName
            );
          })
          .join(', '),
        loading: this.financialServiceProviderConfigurations.isPending(),
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
          '1.2-2',
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
        this.exportRegistrationsMutation.mutate({
          type: ExportType.allPeopleAffected,
          paginateQuery: this.registrationsTable()?.getActionData()?.query,
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
      this.paymentStatus.isPending(),
  );

  // the combination of the effect and the host listener allow us to make sure
  // that the user does not navigate away from the page by using the browser "back" button
  // during the payment creation process
  addCurrentStepToQueryParams = effect(() => {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [queryParamStep]: this.currentStep() || null },
      queryParamsHandling: 'replace',
    });
  });

  @HostListener('window:popstate', ['$event'])
  onPopState() {
    // triggered when the browser "back" button is pressed
    this.goBack();
  }
}
