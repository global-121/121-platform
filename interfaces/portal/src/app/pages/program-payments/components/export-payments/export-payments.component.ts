import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';

import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { ButtonMenuComponent } from '~/components/button-menu/button-menu.component';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProgramApiService } from '~/domains/program/program.api.service';
import {
  programHasPhysicalCardSupport,
  programHasVoucherSupport,
} from '~/domains/program/program.helper';
import { AuthService } from '~/services/auth.service';
import { ExportService } from '~/services/export.service';
import { ToastService } from '~/services/toast.service';
import {
  TrackingAction,
  TrackingCategory,
  TrackingService,
} from '~/services/tracking.service';

@Component({
  selector: 'app-export-payments',
  imports: [
    FormDialogComponent,
    ButtonMenuComponent,
    DatePickerModule,
    FormFieldWrapperComponent,
    ReactiveFormsModule,
  ],
  providers: [ToastService],
  templateUrl: './export-payments.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportPaymentsComponent {
  readonly programId = input.required<string>();

  private authService = inject(AuthService);
  private exportService = inject(ExportService);
  private paymentApiService = inject(PaymentApiService);
  private programApiService = inject(ProgramApiService);
  private toastService = inject(ToastService);
  private trackingService = inject(TrackingService);

  program = injectQuery(this.programApiService.getProgram(this.programId));
  payments = injectQuery(this.paymentApiService.getPayments(this.programId));

  readonly exportlastPaymentsDialog = viewChild.required<FormDialogComponent>(
    'exportlastPaymentsDialog',
  );
  readonly exportUnusedVouchersDialog = viewChild.required<FormDialogComponent>(
    'exportUnusedVouchersDialog',
  );
  readonly exportDebitCardUsageDialog = viewChild.required<FormDialogComponent>(
    'exportDebitCardUsageDialog',
  );

  ExportType = ExportType;

  paymentRangeFormGroup = new FormGroup({
    fromDate: new FormControl<Date | undefined>(
      { value: undefined, disabled: false },
      {},
    ),
    toDate: new FormControl<Date | undefined>(
      { value: undefined, disabled: false },
      {},
    ),
  });

  exportByTypeMutation = injectMutation(() =>
    this.exportService.getExportByTypeMutation(
      this.programId,
      this.toastService,
    ),
  );

  readonly exportOptions = computed<MenuItem[]>(() => [
    {
      label: $localize`Payments`,
      visible:
        (this.payments.data() ?? []).length > 0 &&
        this.authService.hasAllPermissions({
          programId: this.programId(),
          requiredPermissions: [
            PermissionEnum.PaymentREAD,
            PermissionEnum.PaymentTransactionREAD,
            PermissionEnum.RegistrationPaymentExport,
          ],
        }),
      command: () => {
        this.trackingService.trackEvent({
          category: TrackingCategory.export,
          action: TrackingAction.selectDropdownOption,
          name: 'last-payments',
        });
        this.exportlastPaymentsDialog().show({
          trackingEvent: {
            category: TrackingCategory.export,
            action: TrackingAction.clickProceedButton,
            name: 'last-payments',
          },
        });
      },
    },
    {
      label: $localize`:@@export-payments-unused-vouchers:Unused vouchers`,
      visible:
        programHasVoucherSupport(this.program.data()) &&
        (this.payments.data() ?? []).length > 0 &&
        this.authService.hasPermission({
          programId: this.programId(),
          requiredPermission: PermissionEnum.PaymentVoucherExport,
        }),
      command: () => {
        this.trackingService.trackEvent({
          category: TrackingCategory.export,
          action: TrackingAction.selectDropdownOption,
          name: 'unused-vouchers',
        });
        this.exportUnusedVouchersDialog().show({
          trackingEvent: {
            category: TrackingCategory.export,
            action: TrackingAction.clickProceedButton,
            name: 'unused-vouchers',
          },
        });
      },
    },
    {
      label: $localize`:@@export-payments-debit-card-usage:Debit card usage`,
      visible:
        programHasPhysicalCardSupport(this.program.data()) &&
        (this.payments.data() ?? []).length > 0 &&
        this.authService.hasPermission({
          programId: this.programId(),
          requiredPermission: PermissionEnum.FspDebitCardEXPORT,
        }),
      command: () => {
        this.trackingService.trackEvent({
          category: TrackingCategory.export,
          action: TrackingAction.selectDropdownOption,
          name: 'debit-card-usage',
        });
        this.exportDebitCardUsageDialog().show({
          trackingEvent: {
            category: TrackingCategory.export,
            action: TrackingAction.clickProceedButton,
            name: 'debit-card-usage',
          },
        });
      },
    },
  ]);
}
