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
} from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { PageLayoutMonitoringComponent } from '~/components/page-layout-monitoring/page-layout-monitoring.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import {
  PROGRAM_ATTACHMENT_FILE_TYPE_ICONS,
  PROGRAM_ATTACHMENT_FILE_TYPE_LABELS,
} from '~/domains/program/program.helper';
import {
  ProgramAttachment,
  ProgramAttachmentFileType,
} from '~/domains/program/program.model';
import { MonitoringUploadFileDialogComponent } from '~/pages/program-monitoring-files/components/monitoring-upload-file-dialog/monitoring-upload-file-dialog.component';
import { AuthService } from '~/services/auth.service';
import { DownloadService } from '~/services/download.service';
import { ToastService } from '~/services/toast.service';
import { generateFieldErrors } from '~/utils/form-validation';
import { getUniqueUserOptions } from '~/utils/unique-users';

@Component({
  selector: 'app-program-monitoring-files',
  imports: [
    QueryTableComponent,
    ButtonModule,
    FormDialogComponent,
    CheckboxModule,
    FormErrorComponent,
    ReactiveFormsModule,
    MonitoringUploadFileDialogComponent,
    PageLayoutMonitoringComponent,
  ],
  templateUrl: './program-monitoring-files.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class ProgramMonitoringFilesPageComponent {
  readonly programId = input.required<string>();

  readonly authService = inject(AuthService);
  readonly downloadService = inject(DownloadService);
  readonly programApiService = inject(ProgramApiService);
  readonly toastService = inject(ToastService);

  programAttachments = injectQuery(
    this.programApiService.getProgramAttachments(this.programId),
  );

  readonly selectedFile = signal<null | ProgramAttachment>(null);

  readonly deleteFileConfirmationDialog =
    viewChild.required<FormDialogComponent>('deleteFileConfirmationDialog');

  deleteFileFormGroup = new FormGroup({
    confirmAction: new FormControl<boolean>(false, {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.requiredTrue],
    }),
  });

  deleteFileFormFieldErrors = generateFieldErrors(this.deleteFileFormGroup);

  deleteFileMutation = injectMutation(() => ({
    mutationFn: (attachmentId: number) =>
      this.programApiService.removeProgramAttachment({
        programId: this.programId,
        attachmentId,
      }),
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`File deleted successfully`,
      });
    },
  }));

  readonly columns = computed<QueryTableColumn<ProgramAttachment>[]>(() => [
    {
      field: 'fileType',
      header: $localize`File type`,
      type: QueryTableColumnType.MULTISELECT,
      options: Object.values(ProgramAttachmentFileType).map((type) => ({
        label: PROGRAM_ATTACHMENT_FILE_TYPE_LABELS[type],
        value: type,
        icon: PROGRAM_ATTACHMENT_FILE_TYPE_ICONS[type],
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
      options: getUniqueUserOptions(this.programAttachments.data() ?? []),
      displayAsChip: true,
    },
    {
      field: 'created',
      header: $localize`Date and time`,
      type: QueryTableColumnType.DATE,
    },
  ]);

  downloadAttachmentMutation = injectMutation(() => ({
    mutationFn: (file: ProgramAttachment) =>
      this.programApiService.downloadProgramAttachment({
        programId: this.programId,
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
        this.deleteFileConfirmationDialog().show({
          resetMutation: true,
        });
      },
      visible: this.authService.hasPermission({
        programId: this.programId(),
        requiredPermission: PermissionEnum.ProgramAttachmentsDELETE,
      }),
    },
  ]);

  readonly canUploadFiles = computed(() =>
    this.authService.hasPermission({
      programId: this.programId(),
      requiredPermission: PermissionEnum.ProgramAttachmentsCREATE,
    }),
  );
}
