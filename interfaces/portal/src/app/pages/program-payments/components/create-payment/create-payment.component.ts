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
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { format } from 'date-fns';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { map } from 'rxjs';

import { FspIntegrationType } from '@121-service/src/fsp-integrations/shared/enum/fsp-integration-type.enum';
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
import { ExportService } from '~/services/export.service';
import { PaginateQuery } from '~/services/paginate-query.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';
import { Dto } from '~/utils/dto-type';
import { generateFieldErrors } from '~/utils/form-validation';

const noWhitespaceOnlyValueValidator = (
  control: AbstractControl<null | string>,
): null | ValidationErrors => {
  const value = control.value;
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  return value.trim().length > 0 ? null : { whitespaceOnly: true };
};

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
  readonly exportService = inject(ExportService);
  readonly fspConfigurationApiService = inject(FspConfigurationApiService);
  readonly rtlHelper = inject(RtlHelperService);
  readonly router = inject(Router);
  readonly paymentApiService = inject(PaymentApiService);
  readonly programApiService = inject(ProgramApiService);
  readonly toastService = inject(ToastService);
  readonly translatableStringService = inject(TranslatableStringService);
  readonly metricApiService = inject(MetricApiService);

  readonly registrationsTable =
    viewChild<RegistrationsTableComponent>('registrationsTable');

  readonly dialogVisible = model(false);
  readonly currentStep = signal<0 | 1 | 2 | 3>(0);
  readonly dryRunResult = signal<Dto<BulkActionResultPaymentDto> | undefined>(
    undefined,
  );

  today = new Date();
  protected readonly MAX_PAYMENT_NAME_LENGTH: number = 60;
  paymentNameTooltip = $localize`Payments are named by date and time by default. Rename the payment for clarity if needed.`;
  overrideFilters = {
    // only registrations with status "included" are eligible for payment
    status: RegistrationStatusEnum.included,
  };
  includedChipData = getChipDataByRegistrationStatus(
    RegistrationStatusEnum.included,
  );
  readonly paymentFormGroup = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        Validators.required,
        Validators.maxLength(this.MAX_PAYMENT_NAME_LENGTH),
        noWhitespaceOnlyValueValidator,
      ],
    }),
    note: new FormControl('', {
      nonNullable: true,
    }),
  });

  formFieldErrors = generateFieldErrors(this.paymentFormGroup);

  private readonly isNameInvalid = toSignal(
    this.paymentFormGroup.controls.name.statusChanges.pipe(
      map(() => this.paymentFormGroup.controls.name.invalid),
    ),
    { initialValue: this.paymentFormGroup.controls.name.invalid },
  );

  fspConfigurations = injectQuery(
    this.fspConfigurationApiService.getFspConfigurations(this.programId),
  );
  program = injectQuery(this.programApiService.getProgram(this.programId));
  payments = injectQuery(
    this.paymentApiService.getPaymentAggregationsSummaries(this.programId),
  );
  paymentStatus = injectQuery(
    this.paymentApiService.getPaymentStatus(this.programId),
  );

  readonly transferValue = computed(
    () => this.program.data()?.fixedTransferValue ?? 0,
  );

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
      ? $localize`Continue to registration`
      : this.currentStep() === 2
        ? $localize`Add to payment`
        : $localize`Create payment`,
  );

  readonly isPending = computed(() => this.createPaymentMutation.isPending());

  readonly cannotProceed = computed(
    () =>
      this.isPending() ||
      this.program.isPending() ||
      this.paymentStatus.isPending() ||
      (this.currentStep() === 1 && this.isNameInvalid()),
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
          name:
            this.paymentFormGroup.value.name ?? this.getDefaultPaymentName(),
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
        this.currentStep.set(3);
        return;
      }

      // Do not set dialogVisible to false here, otherwise the addCurrentStepToQueryParams
      // effect will be triggered, blocking the user from navigating away
      // this.dialogVisible.set(false);
      const paymentId = result.id;
      if (!paymentId) {
        this.toastService.showToast({
          severity: 'error',
          detail: $localize`Payment creation did not return a payment reference. Please stay on this screen and refresh the payments list before trying again.`,
        });
        return;
      }
      await this.router.navigate([
        '/',
        AppRoutes.program,
        this.programId(),
        AppRoutes.programPayments,
        paymentId,
      ]);

      this.toastService.showToast({
        detail: $localize`Payment created.`,
      });
      this.dialogVisible.set(false);
      this.currentStep.set(0);
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

    this.paymentFormGroup.reset({
      name: this.getDefaultPaymentName(),
      note: '',
    });
    this.registrationsTable()?.resetSelection();
    this.dryRunResult.set(undefined);
    this.currentStep.set(1);
    this.dialogVisible.set(true);
  }

  goBack() {
    switch (this.currentStep()) {
      case 3:
        this.dryRunResult.set(undefined);
        this.currentStep.set(2);
        break;
      case 2:
        this.currentStep.set(1);
        break;
      case 1:
        this.currentStep.set(0);
        this.dialogVisible.set(false);
        break;
    }
  }

  createPayment() {
    if (this.currentStep() === 1) {
      this.paymentFormGroup.controls.name.markAsTouched();
      if (this.paymentFormGroup.controls.name.invalid) {
        return;
      }

      this.currentStep.set(2);
      return;
    }

    const actionData = this.registrationsTable()?.getActionData();

    if (!actionData) {
      return;
    }

    this.createPaymentMutation.mutate({
      dryRun: this.currentStep() === 2,
      paginateQuery: actionData.query,
    });
  }

  private getDefaultPaymentName(): string {
    const prefix = $localize`Payment`;
    return `${prefix} ${format(new Date(), 'dd/MM/yy, HH:mm')}`;
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
