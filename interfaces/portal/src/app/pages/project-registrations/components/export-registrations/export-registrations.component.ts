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
import { ConfirmationDialogComponent } from '~/components/confirmation-dialog/confirmation-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { Registration } from '~/domains/registration/registration.model';
import { LatestExportDateComponent } from '~/pages/project-registrations/components/latest-export-date/latest-export-date.component';
import { AuthService } from '~/services/auth.service';
import { DownloadService } from '~/services/download.service';
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
    ConfirmationDialogComponent,
    LatestExportDateComponent,
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
  private downloadService = inject(DownloadService);
  private exportService = inject(ExportService);
  private projectApiService = inject(ProjectApiService);
  private toastService = inject(ToastService);
  private trackingService = inject(TrackingService);

  readonly exportSelectedDialog =
    viewChild.required<ConfirmationDialogComponent>('exportSelectedDialog');
  readonly exportDataChangesDialog =
    viewChild.required<ConfirmationDialogComponent>('exportDataChangesDialog');
  readonly exportAccountVerificationDialog =
    viewChild.required<ConfirmationDialogComponent>(
      'exportAccountVerificationDialog',
    );

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
    fromDate: new FormControl<Date | undefined>(undefined, {}),
    toDate: new FormControl<Date | undefined>(undefined, {}),
  });

  exportRegistrationsMutation = injectMutation(() => ({
    mutationFn: this.exportService.getExportListMutation(
      this.projectId,
      this.toastService,
    ),
    onSuccess: ({ exportResult: file, filename }) => {
      this.downloadService.downloadFile({ file, filename });
    },
  }));

  exportCBEVerificationReportMutation = injectMutation(() => ({
    mutationFn: this.exportService.getExportCBEVerificationReportMutation(
      this.projectId,
    ),
    onSuccess: ({ data: data, fileName: fileName }) => {
      void this.downloadService.downloadArrayToXlsx({
        data,
        fileName,
      });
    },
  }));

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
        this.exportSelectedDialog().askForConfirmation({
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
        this.exportDataChangesDialog().askForConfirmation({
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
        this.exportAccountVerificationDialog().askForConfirmation({
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
