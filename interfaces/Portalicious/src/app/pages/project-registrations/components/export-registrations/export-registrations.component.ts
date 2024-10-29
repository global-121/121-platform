import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  ViewChild,
} from '@angular/core';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { SplitButtonModule } from 'primeng/splitbutton';

import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';

import { ConfirmationDialogComponent } from '~/components/confirmation-dialog/confirmation-dialog.component';
import { Registration } from '~/domains/registration/registration.model';
import { LatestExportDateComponent } from '~/pages/project-registrations/components/latest-export-date/latest-export-date.component';
import { ExportService } from '~/services/export.service';
import {
  ActionDataWithPaginateQuery,
  PaginateQuery,
} from '~/services/paginate-query.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-export-registrations',
  standalone: true,
  imports: [
    SplitButtonModule,
    ConfirmationDialogComponent,
    LatestExportDateComponent,
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

  private exportService = inject(ExportService);
  private toastService = inject(ToastService);

  @ViewChild('exportSelectedDialog')
  private exportSelectedDialog: ConfirmationDialogComponent;
  @ViewChild('exportAllDialog')
  private exportAllDialog: ConfirmationDialogComponent;

  exportSelectedActionData = signal<
    ActionDataWithPaginateQuery<Registration> | undefined
  >(undefined);

  ExportType = ExportType;

  exportRegistrationsMutation = injectMutation(() => ({
    mutationFn: async (exportOptions: {
      type: 'pa-data-changes' | ExportType;
      paginateQuery?: PaginateQuery;
      fromDate?: string;
      toDate?: string;
      minPayment?: number;
      maxPayment?: number;
    }) => {
      this.toastService.showToast({
        summary: $localize`Preparing export`,
        detail: $localize`This might take a few minutes.\n\nThe file will be automatically downloaded when ready. Closing this notification will not cancel the export.`,
        severity: 'info',
        showSpinner: true,
      });

      return this.exportService.getExportList({
        ...exportOptions,
        projectId: this.projectId,
      });
    },
    onSuccess: ({ exportResult, filename }) => {
      const downloadURL = window.URL.createObjectURL(exportResult);
      const link = document.createElement('a');
      link.href = downloadURL;
      link.download = filename;
      link.click();
      this.toastService.showToast({
        detail: $localize`Export downloaded.`,
        severity: 'success',
      });
    },
  }));

  exportSelectedRegistrations() {
    const actionData = this.getActionData()();
    if (!actionData) {
      return;
    }

    this.exportSelectedActionData.set(actionData);
    this.exportSelectedDialog.askForConfirmation();
  }

  exportOptions: MenuItem[] = [
    {
      label: $localize`:@@export-all:Export all registrations`,
      command: () => {
        this.exportAllDialog.askForConfirmation();
      },
    },
    {
      label: $localize`:@@export-duplicate:Export duplicate registrations`,
      command: () => {
        this.toastService.showToast({
          detail: 'That has not been implemented yet...',
          severity: 'warn',
        });
      },
    },
    {
      label: $localize`:@@export-changes:Export status & data changes`,
      command: () => {
        this.toastService.showToast({
          detail: 'That has not been implemented yet...',
          severity: 'warn',
        });
      },
    },
    {
      label: $localize`:@@export-verification:Export Account number verification`,
      command: () => {
        this.toastService.showToast({
          detail: 'That has not been implemented yet...',
          severity: 'warn',
        });
      },
    },
  ];
}
