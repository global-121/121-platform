import { CurrencyPipe, DatePipe } from '@angular/common';
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
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';

import { FspIntegrationType } from '@121-service/src/fsp-management/enums/fsp-integration-type.enum';
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
import { EllipsisMenuComponent } from '~/components/ellipsis-menu/ellipsis-menu.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { FullscreenStepperDialogComponent } from '~/components/fullscreen-stepper-dialog/fullscreen-stepper-dialog.component';
import { RegistrationsTableComponent } from '~/components/registrations-table/registrations-table.component';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { fspConfigurationNamesHaveIntegrationType } from '~/domains/program/program.helper';
import { DownloadService } from '~/services/download.service';
import { ExportService } from '~/services/export.service';
import { PaginateQuery } from '~/services/paginate-query.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';
import { Dto } from '~/utils/dto-type';

@Component({
  selector: 'app-create-payment',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    DatePipe,
    RegistrationsTableComponent,
    CardModule,
    DataListComponent,
    ColoredChipComponent,
    FullscreenStepperDialogComponent,
    FormFieldWrapperComponent,
    InputText,
    EllipsisMenuComponent,
  ],
  templateUrl: './create-payment.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CurrencyPipe, ToastService],
})
export class CreatePaymentComponent {
  readonly programId = input.required<string>();

  readonly currencyPipe = inject(CurrencyPipe);
  readonly downloadService = inject(DownloadService);
  readonly exportService = inject(ExportService);
  readonly fspConfigurationApiService = inject(FspConfigurationApiService);
  readonly rtlHelper = inject(RtlHelperService);
  readonly router = inject(Router);
  readonly paymentApiService = inject(PaymentApiService);
  readonly programApiService = inject(ProgramApiService);
  readonly toastService = inject(ToastService);
  readonly translatableStringService = inject(TranslatableStringService);
  readonly metricApiService = inject(MetricApiService);

  readonly createPaymentDialog =
    viewChild.required<FullscreenStepperDialogComponent>('createPaymentDialog');
  readonly registrationsTable =
    viewChild<RegistrationsTableComponent>('registrationsTable');

  readonly dialogVisible = model(false);
  readonly dryRunResult = signal<Dto<BulkActionResultPaymentDto> | undefined>(
    undefined,
  );

  today = new Date();
  overrideFilters = {
    // only registrations with status "included" are eligible for payment
    status: RegistrationStatusEnum.included,
  };
  includedChipData = getChipDataByRegistrationStatus(
    RegistrationStatusEnum.included,
  );
  paymentFormGroup = new FormGroup({
    note: new FormControl('', {
      nonNullable: true,
    }),
  });

  fspConfigurations = injectQuery(
    this.fspConfigurationApiService.getFspConfigurations(this.programId),
  );
  program = injectQuery(this.programApiService.getProgram(this.programId));
  payments = injectQuery(this.paymentApiService.getPayments(this.programId));
  paymentStatus = injectQuery(
    this.paymentApiService.getPaymentStatus(this.programId),
  );

  readonly transferValue = computed(
    () => this.program.data()?.fixedTransferValue ?? 0,
  );

  readonly currentStep = computed(() => {
    if (!this.dialogVisible()) {
      return 0;
    }

    if (this.dryRunResult()) {
      return 2;
    }

    return 1;
  });

  readonly paymentHasIntegratedFsp = computed(() =>
    this.paymentHasIntegrationType(FspIntegrationType.api),
  );

  readonly paymentHasExcelFsp = computed(() =>
    this.paymentHasIntegrationType(FspIntegrationType.csv),
  );

  readonly paymentSummaryData = computed(() => {
    const dryRunResult = this.dryRunResult();

    if (!dryRunResult) {
      return [];
    }

    const listData: DataListItem[] = [
      {
        label: $localize`Financial Service Provider(s)`,
        type: 'options',
        value: dryRunResult.programFspConfigurationNames,
        options: (this.fspConfigurations.data() ?? []).map((fspConfig) => ({
          label: fspConfig.label,
          value: fspConfig.name,
        })),
        loading: this.fspConfigurations.isPending(),
      },
      {
        label: $localize`Registrations`,
        value: dryRunResult.applicableCount.toString(),
      },
      {
        label: $localize`Total payment amount`,
        value: this.currencyPipe.transform(
          this.transferValue() * dryRunResult.sumPaymentAmountMultiplier,
          this.program.data()?.currency,
          'symbol-narrow',
          '1.2-2',
        ),
        tooltip: $localize`The total payment amount is calculated by summing up the transfer values of each included registration added to the payment.`,
        fullWidth: true,
      },
    ];

    return listData;
  });

  readonly paymentSummaryMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`Export payment list`,
      icon: 'pi pi-upload',
      command: () => {
        this.exportByTypeMutation.mutate({
          type: ExportType.registrations,
          paginateQuery: this.registrationsTable()?.getActionData()?.query,
        });
      },
    },
  ]);

  readonly proceedLabel = computed(() =>
    this.currentStep() === 1
      ? $localize`Add to payment`
      : $localize`Create payment`,
  );

  readonly cannotProceed = computed(
    () =>
      this.createPaymentMutation.isPending() ||
      this.program.isPending() ||
      this.paymentStatus.isPending(),
  );

  exportByTypeMutation = injectMutation(() =>
    this.exportService.getExportByTypeMutation(
      this.programId,
      this.toastService,
    ),
  );

  createPaymentMutation = injectMutation(() => ({
    mutationFn: async ({
      dryRun,
      paginateQuery,
    }: {
      dryRun: boolean;
      paginateQuery: PaginateQuery;
    }) => {
      const paymentResult = await this.paymentApiService.createPayment({
        programId: this.programId,
        paginateQuery,
        paymentData: {
          transferValue: this.transferValue(),
          note: this.paymentFormGroup.value.note,
        },
        dryRun,
      });

      if (!dryRun) {
        // wait 1 second before resolving, to give the backend time to create at least one transaction in the DB
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      return paymentResult;
    },
    onSuccess: async (result, { dryRun }) => {
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
      const paymentId = result.id;
      if (paymentId) {
        await this.router.navigate([
          '/',
          AppRoutes.program,
          this.programId(),
          AppRoutes.programPayments,
          paymentId,
        ]);
      }

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
  }

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
    });
  }

  private paymentHasIntegrationType(integrationType: FspIntegrationType) {
    const program = this.program.data();
    const dryRunResult = this.dryRunResult();

    if (!program || !dryRunResult) {
      return false;
    }

    return fspConfigurationNamesHaveIntegrationType({
      program,
      fspConfigurationNames: dryRunResult.programFspConfigurationNames,
      integrationType,
    });
  }
}
