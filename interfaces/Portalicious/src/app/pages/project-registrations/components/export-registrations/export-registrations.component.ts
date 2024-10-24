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
import { FormsModule } from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { CalendarModule } from 'primeng/calendar';
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
  standalone: true,
  imports: [
    ConfirmationDialogComponent,
    LatestExportDateComponent,
    ButtonMenuComponent,
    CalendarModule,
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
  projectId = input.required<number>();
  getActionData =
    input.required<
      () => ActionDataWithPaginateQuery<Registration> | undefined
    >();

  private authService = inject(AuthService);
  private downloadService = inject(DownloadService);
  private exportService = inject(ExportService);
  private projectApiService = inject(ProjectApiService);
  private toastService = inject(ToastService);

  @ViewChild('exportSelectedDialog')
  private exportSelectedDialog: ConfirmationDialogComponent;
  @ViewChild('exportDuplicatesDialog')
  private exportDuplicatesDialog: ConfirmationDialogComponent;
  @ViewChild('exportDataChangesDialog')
  private exportDataChangesDialog: ConfirmationDialogComponent;
  @ViewChild('exportAccountVerificationDialog')
  private exportAccountVerificationDialog: ConfirmationDialogComponent;

  exportSelectedActionData = signal<
    ActionDataWithPaginateQuery<Registration> | undefined
  >(undefined);

  fromDateExport = model<Date>();
  toDateExport = model<Date>();

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

  exportCBEVerificationReportMutation = injectMutation((queryClient) => ({
    mutationFn: () =>
      queryClient.fetchQuery(
        this.projectApiService.getCbeVerificationReport(this.projectId)(),
      ),
    onSuccess: this.exportService.downloadArrayToXlsx(),
  }));

  exportOptions = computed<MenuItem[]>(() => [
    {
      label: $localize`:@@export-selected:Export selected registrations`,
      command: () => {
        const actionData = this.getActionData()();
        if (!actionData) {
          return;
        }
        this.exportSelectedActionData.set(actionData);
        this.exportSelectedDialog.askForConfirmation();
      },
    },
    {
      label: $localize`:@@export-duplicate:Export duplicate registrations`,
      command: () => {
        this.exportDuplicatesDialog.askForConfirmation();
      },
    },
    {
      label: $localize`:@@export-changes:Export status & data changes`,
      command: () => {
        this.fromDateExport.set(undefined);
        this.toDateExport.set(undefined);
        this.exportDataChangesDialog.askForConfirmation();
      },
    },
    {
      label: $localize`:@@export-verification:Export account number verification`,
      visible:
        this.isCBEProject() &&
        this.authService.hasPermission({
          projectId: this.projectId(),
          requiredPermission: PermissionEnum.PaymentFspInstructionREAD,
        }),
      command: () => {
        this.exportAccountVerificationDialog.askForConfirmation();
      },
    },
  ]);

  isCBEProject = computed(() =>
    this.project
      .data()
      ?.programFinancialServiceProviderConfigurations.some(
        (fsp) =>
          fsp.financialServiceProviderName ===
          FinancialServiceProviders.commercialBankEthiopia,
      ),
  );
}
