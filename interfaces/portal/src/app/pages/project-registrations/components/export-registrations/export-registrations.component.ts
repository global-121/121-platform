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

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { ButtonMenuComponent } from '~/components/button-menu/button-menu.component';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
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
  ],
  templateUrl: './export-registrations.component.html',
  styles: ``,
  providers: [ToastService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportRegistrationsComponent {
  readonly projectId = input.required<string>();
  readonly getActionData =
    input.required<
      () => ActionDataWithPaginateQuery<Registration> | undefined
    >();

  private authService = inject(AuthService);
  private exportService = inject(ExportService);
  private projectApiService = inject(ProjectApiService);
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

  readonly exportSelectedActionData = signal<
    ActionDataWithPaginateQuery<Registration> | undefined
  >(undefined);

  ExportType = ExportType;

  project = injectQuery(this.projectApiService.getProject(this.projectId));

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
      this.projectId,
      this.toastService,
    ),
  );

  exportCBEVerificationReportMutation = injectMutation(() =>
    this.exportService.getExportCBEVerificationReportMutation(
      this.projectId,
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
      label: $localize`:@@export-verification:Account number verification`,
      visible:
        this.isCBEProject() &&
        this.authService.hasPermission({
          projectId: this.projectId(),
          requiredPermission: PermissionEnum.PaymentFspInstructionREAD,
        }),
      command: () => {
        this.trackingService.trackEvent({
          category: TrackingCategory.export,
          action: TrackingAction.selectDropdownOption,
          name: 'account-number-verification',
        });
        this.exportAccountVerificationDialog().show({
          trackingEvent: {
            category: TrackingCategory.export,
            action: TrackingAction.clickProceedButton,
            name: 'account-number-verification',
          },
        });
      },
    },
  ]);

  readonly isCBEProject = computed(() =>
    this.project
      .data()
      ?.programFspConfigurations.some(
        (fsp) => fsp.fspName === Fsps.commercialBankEthiopia,
      ),
  );
}
