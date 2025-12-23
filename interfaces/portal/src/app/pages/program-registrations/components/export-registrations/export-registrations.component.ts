import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { RadioButtonModule } from 'primeng/radiobutton';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { ButtonMenuComponent } from '~/components/button-menu/button-menu.component';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { Registration } from '~/domains/registration/registration.model';
import { AuthService } from '~/services/auth.service';
import { ExportService } from '~/services/export.service';
import { ActionDataWithPaginateQuery } from '~/services/paginate-query.service';
import { ToastService } from '~/services/toast.service';
import {
  TrackingAction,
  TrackingCategory,
  TrackingService,
} from '~/services/tracking.service';

@Component({
  selector: 'app-export-registrations',
  imports: [
    FormDialogComponent,
    ButtonMenuComponent,
    DatePickerModule,
    FloatLabelModule,
    ReactiveFormsModule,
    FormFieldWrapperComponent,
    RadioButtonModule,
    ManualLinkComponent,
  ],
  templateUrl: './export-registrations.component.html',
  styles: ``,
  providers: [ToastService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportRegistrationsComponent {
  readonly programId = input.required<string>();
  readonly getActionData =
    input.required<
      () => ActionDataWithPaginateQuery<Registration> | undefined
    >();

  private authService = inject(AuthService);
  private exportService = inject(ExportService);
  private programApiService = inject(ProgramApiService);
  private toastService = inject(ToastService);
  private trackingService = inject(TrackingService);

  readonly exportSelectedDialog = viewChild.required<FormDialogComponent>(
    'exportSelectedDialog',
  );
  readonly exportDataChangesDialog = viewChild.required<FormDialogComponent>(
    'exportDataChangesDialog',
  );
  readonly exportAccountVerificationDialog =
    viewChild.required<FormDialogComponent>('exportAccountVerificationDialog');
  readonly exportOromiaAccountVerificationDialog =
    viewChild.required<FormDialogComponent>(
      'exportOromiaAccountVerificationDialog',
    );

  readonly exportSelectedActionData = signal<
    ActionDataWithPaginateQuery<Registration> | undefined
  >(undefined);

  ExportType = ExportType;

  program = injectQuery(this.programApiService.getProgram(this.programId));

  exportRegistrationsFormGroup = new FormGroup({
    format: new FormControl<'csv' | 'xlsx'>('xlsx', {
      nonNullable: true,
    }),
  });

  dataChangesFormGroup = new FormGroup({
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

  exportCBEVerificationReportMutation = injectMutation(() =>
    this.exportService.getExportCBEVerificationReportMutation(
      this.programId,
      this.toastService,
    ),
  );

  exportCooperativeBankOfOromiaVerificationReportMutation = injectMutation(() =>
    this.exportService.getExportCooperativeBankOfOromiaVerificationReportMutation(
      this.programId,
      this.toastService,
    ),
  );

  readonly exportOptions = computed<MenuItem[]>(() => [
    {
      label: $localize`:@@export-selected:Selected registrations`,
      command: () => {
        this.trackingService.trackEvent({
          category: TrackingCategory.export,
          action: TrackingAction.selectDropdownOption,
          name: 'selected-registrations',
        });
        const actionData = this.getActionData()();

        if (!actionData) {
          return;
        }

        this.exportSelectedActionData.set(actionData);
        this.exportSelectedDialog().show({
          trackingEvent: {
            category: TrackingCategory.export,
            action: TrackingAction.clickProceedButton,
            name: 'selected-registrations',
          },
        });
      },
    },
    {
      label: $localize`:@@export-changes:Status & data changes`,
      command: () => {
        this.trackingService.trackEvent({
          category: TrackingCategory.export,
          action: TrackingAction.selectDropdownOption,
          name: 'status-and-data-changes',
        });
        this.dataChangesFormGroup.controls.fromDate.setValue(undefined);
        this.dataChangesFormGroup.controls.toDate.setValue(undefined);
        this.exportDataChangesDialog().show({
          trackingEvent: {
            category: TrackingCategory.export,
            action: TrackingAction.clickProceedButton,
            name: 'status-and-data-changes',
          },
        });
      },
    },
    {
      label: $localize`:@@export-verification-commercial-bank-of-ethiopia:CBE verification report`,
      visible:
        this.isCBEProgram() &&
        this.authService.hasPermission({
          programId: this.programId(),
          requiredPermission: PermissionEnum.RegistrationPersonalREAD,
        }),
      command: () => {
        this.trackingService.trackEvent({
          category: TrackingCategory.export,
          action: TrackingAction.selectDropdownOption,
          name: 'account-number-verification for:cbe',
        });
        this.exportAccountVerificationDialog().show({
          trackingEvent: {
            category: TrackingCategory.export,
            action: TrackingAction.clickProceedButton,
            name: 'account-number-verification for:cbe',
          },
        });
      },
    },
    {
      label: $localize`:@@export-verification-cooperative-bank-of-oromia:Coopbank verification report`,
      visible:
        this.isCooperativeBankOfOromiaProgram() &&
        this.authService.hasPermission({
          programId: this.programId(),
          requiredPermission: PermissionEnum.RegistrationPersonalREAD,
        }),
      command: () => {
        this.trackingService.trackEvent({
          category: TrackingCategory.export,
          action: TrackingAction.selectDropdownOption,
          name: 'account-number-verification for:coopbank',
        });
        this.exportOromiaAccountVerificationDialog().show({
          trackingEvent: {
            category: TrackingCategory.export,
            action: TrackingAction.clickProceedButton,
            name: 'account-number-verification for:coopbank',
          },
        });
      },
    },
  ]);

  readonly isCBEProgram = computed(() =>
    this.program
      .data()
      ?.programFspConfigurations.some(
        (fsp) => fsp.fspName === Fsps.commercialBankEthiopia,
      ),
  );

  readonly isCooperativeBankOfOromiaProgram = computed(() =>
    this.program
      .data()
      ?.programFspConfigurations.some(
        (fsp) => fsp.fspName === Fsps.cooperativeBankOfOromia,
      ),
  );
}
