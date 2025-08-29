import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  injectMutation,
  injectQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { ConfirmationDialogComponent } from '~/components/confirmation-dialog/confirmation-dialog.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { PageLayoutMonitoringComponent } from '~/components/page-layout-monitoring/page-layout-monitoring.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { PROJECT_ATTACHMENT_FILE_TYPE_LABELS } from '~/domains/project/project.helper';
import {
  ProjectAttachment,
  ProjectAttachmentFileType,
} from '~/domains/project/project.model';
import { MonitoringUploadFileDialogComponent } from '~/pages/project-monitoring-files/components/monitoring-upload-file-dialog/monitoring-upload-file-dialog.component';
import { TableCellFileTypeComponent } from '~/pages/project-monitoring-files/components/table-cell-file-type.component';
import { AuthService } from '~/services/auth.service';
import { DownloadService } from '~/services/download.service';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';
import { getUniqueUserOptions } from '~/utils/unique-users';

type DeleteFileFormGroup =
  (typeof ProjectMonitoringFilesPageComponent)['prototype']['deleteFileFormGroup'];

@Component({
  selector: 'app-monitoring-files',
  imports: [
    QueryTableComponent,
    ButtonModule,
    ConfirmationDialogComponent,
    CheckboxModule,
    FormErrorComponent,
    ReactiveFormsModule,
    MonitoringUploadFileDialogComponent,
    PageLayoutMonitoringComponent,
  ],
  templateUrl: './project-monitoring-files.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class ProjectMonitoringFilesPageComponent {
  readonly projectId = input.required<string>();

  readonly authService = inject(AuthService);
  readonly downloadService = inject(DownloadService);
  readonly queryClient = inject(QueryClient);
  readonly projectApiService = inject(ProjectApiService);
  readonly toastService = inject(ToastService);

  projectAttachments = injectQuery(
    this.projectApiService.getProjectAttachments(this.projectId),
  );

  readonly selectedFile = signal<null | ProjectAttachment>(null);

  readonly deleteFileConfirmationDialog =
    viewChild.required<ConfirmationDialogComponent>(
      'deleteFileConfirmationDialog',
    );

  deleteFileFormGroup = new FormGroup({
    confirmAction: new FormControl<boolean>(false, {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.requiredTrue],
    }),
  });

  deleteFileFormFieldErrors = generateFieldErrors<DeleteFileFormGroup>(
    this.deleteFileFormGroup,
    {
      confirmAction: genericFieldIsRequiredValidationMessage,
    },
  );

  deleteFileMutation = injectMutation(() => ({
    mutationFn: (attachmentId: number) =>
      this.projectApiService.removeProjectAttachment({
        projectId: this.projectId,
        attachmentId,
      }),
    onSuccess: () => {
      void this.projectApiService.invalidateCache(this.projectId);
      this.toastService.showToast({
        detail: $localize`File deleted successfully`,
      });
    },
  }));

  readonly columns = computed<QueryTableColumn<ProjectAttachment>[]>(() => [
    {
      field: 'fileType',
      header: $localize`File type`,
      component: TableCellFileTypeComponent,
      type: QueryTableColumnType.MULTISELECT,
      options: Object.values(ProjectAttachmentFileType).map((type) => ({
        label:
          PROJECT_ATTACHMENT_FILE_TYPE_LABELS[
            type as ProjectAttachmentFileType
          ],
        value: type,
      })),
    },
    {
      field: 'filename',
      header: $localize`File name`,
    },
    {
      field: 'user.username',
      header: $localize`Imported by`,
      type: QueryTableColumnType.MULTISELECT,
      options: getUniqueUserOptions(this.projectAttachments.data() ?? []),
    },
    {
      field: 'created',
      header: $localize`Date and time`,
      type: QueryTableColumnType.DATE,
    },
  ]);

  downloadAttachmentMutation = injectMutation(() => ({
    mutationFn: (file: ProjectAttachment) =>
      this.projectApiService.downloadProjectAttachment({
        projectId: this.projectId,
        attachmentId: file.id,
      }),
    onSuccess: (file, { filename }) => {
      this.downloadService.downloadFile({ file, filename });
    },
  }));

  readonly contextMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`:@@generic-download:Download`,
      icon: 'pi pi-download',
      command: () => {
        const selectedFile = this.selectedFile();
        if (!selectedFile) {
          // Should never happen, but keeps TS happy
          return;
        }

        this.toastService.showToast({
          severity: 'info',
          summary: $localize`Downloading file`,
          showSpinner: true,
        });

        this.downloadAttachmentMutation.mutate(selectedFile);
      },
    },
    {
      label: $localize`:@@generic-delete:Delete`,
      icon: 'pi pi-trash text-red-500',
      command: () => {
        this.deleteFileFormGroup.reset();
        this.deleteFileConfirmationDialog().askForConfirmation({
          resetMutation: true,
        });
      },
      visible: this.authService.hasPermission({
        projectId: this.projectId(),
        requiredPermission: PermissionEnum.ProjectAttachmentsDELETE,
      }),
    },
  ]);

  readonly canUploadFiles = computed(() =>
    this.authService.hasPermission({
      projectId: this.projectId(),
      requiredPermission: PermissionEnum.ProjectAttachmentsCREATE,
    }),
  );
}
