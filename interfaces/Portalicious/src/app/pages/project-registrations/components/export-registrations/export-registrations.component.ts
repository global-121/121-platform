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
import { FormsModule } from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';

import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
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

@Component({
  selector: 'app-export-registrations',
  imports: [
    ConfirmationDialogComponent,
    LatestExportDateComponent,
    ButtonMenuComponent,
    DatePickerModule,
    FloatLabelModule,
    FormsModule,
    FormFieldWrapperComponent,
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

  readonly exportSelectedDialog =
    viewChild.required<ConfirmationDialogComponent>('exportSelectedDialog');
  readonly exportDuplicatesDialog =
    viewChild.required<ConfirmationDialogComponent>('exportDuplicatesDialog');
  readonly exportDataChangesDialog =
    viewChild.required<ConfirmationDialogComponent>('exportDataChangesDialog');
  readonly exportAccountVerificationDialog =
    viewChild.required<ConfirmationDialogComponent>(
      'exportAccountVerificationDialog',
    );

  readonly exportSelectedActionData = signal<
    ActionDataWithPaginateQuery<Registration> | undefined
  >(undefined);

  readonly fromDateExport = model<Date>();
  readonly toDateExport = model<Date>();

  ExportType = ExportType;

  project = injectQuery(this.projectApiService.getProject(this.projectId));

  duplicateExportAttributes = injectQuery(() => ({
    queryKey: [this.projectId()],
    queryFn: () =>
      this.exportService.getDuplicateCheckAttributes(this.projectId),
  }));

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
      this.exportService.downloadArrayToXlsx()({
        data,
        fileName,
      });
    },
  }));

  readonly exportOptions = computed<MenuItem[]>(() => [
    {
      label: $localize`:@@export-selected:Selected registrations`,
      command: () => {
        const actionData = this.getActionData()();
        if (!actionData) {
          return;
        }
        this.exportSelectedActionData.set(actionData);
        this.exportSelectedDialog().askForConfirmation();
      },
    },
    {
      label: $localize`:@@export-duplicate:Duplicate registrations`,
      command: () => {
        this.exportDuplicatesDialog().askForConfirmation();
      },
    },
    {
      label: $localize`:@@export-changes:Status & data changes`,
      command: () => {
        this.fromDateExport.set(undefined);
        this.toDateExport.set(undefined);
        this.exportDataChangesDialog().askForConfirmation();
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
        this.exportAccountVerificationDialog().askForConfirmation();
      },
    },
  ]);

  readonly isCBEProject = computed(() =>
    this.project
      .data()
      ?.programFinancialServiceProviderConfigurations.some(
        (fsp) =>
          fsp.financialServiceProviderName ===
          FinancialServiceProviders.commercialBankEthiopia,
      ),
  );
}
