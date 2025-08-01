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

import { injectMutation } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';

import { ConfirmationDialogComponent } from '~/components/confirmation-dialog/confirmation-dialog.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { MonitoringUploadFileDialogComponent } from '~/pages/project-monitoring/components/monitoring-upload-file-dialog/monitoring-upload-file-dialog.component';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

interface File {
  id: string;
  type: string;
  name: string;
  size: number;
  createdAt: Date;
  createdBy: string;
}

type DeleteFileFormGroup =
  (typeof MonitoringFilesComponent)['prototype']['deleteFileFormGroup'];

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
  ],
  templateUrl: './monitoring-files.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class MonitoringFilesComponent {
  readonly toastService = inject(ToastService);

  readonly projectId = input.required<string>();

  readonly selectedFile = signal<File | null>(null);

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
    mutationFn: ({
      confirmAction,
    }: ReturnType<DeleteFileFormGroup['getRawValue']>) => {
      // XXX: Implement file deletion logic
      console.log('File deletion triggered with confirmation:', confirmAction);
      return Promise.resolve();
    },
    onSuccess: () => {
      // XXX: Invalidate file cache
      this.toastService.showToast({
        severity: 'warn',
        detail: 'File deletion not implemented yet.',
      });
    },
  }));

  // XXX: should be an injectQuery to fetch files from a service
  readonly files = computed<File[]>(() => [
    {
      id: '1',
      type: 'CSV',
      name: 'data_export.csv',
      size: 2048,
      createdAt: new Date(),
      createdBy: 'User A',
    },
    {
      id: '2',
      type: 'XLSX',
      name: 'data_analysis.xlsx',
      size: 4096,
      createdAt: new Date(),
      createdBy: 'User B',
    },
  ]);

  readonly columns = computed<QueryTableColumn<File>[]>(() => [
    {
      field: 'type',
      header: $localize`File type`,
    },
    {
      field: 'name',
      header: $localize`File name`,
    },
    {
      field: 'createdBy',
      header: $localize`Imported by`,
    },
    {
      field: 'createdAt',
      header: $localize`Date and time`,
      type: QueryTableColumnType.DATE,
    },
  ]);

  readonly contextMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`:@@generic-download:Download`,
      icon: 'pi pi-download',
      command: () => {
        // XXX: Implement file download logic
        this.toastService.showToast({
          severity: 'warn',
          detail: 'File download not implemented yet.',
        });
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
    },
  ]);

  readonly canUploadFiles = computed(
    () =>
      // XXX: Implement logic to determine if files can be uploaded
      true,
  );
}
