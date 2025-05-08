import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
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
import { MultiSelectModule } from 'primeng/multiselect';

import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import { ButtonMenuComponent } from '~/components/button-menu/button-menu.component';
import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { getChipDataByRegistrationStatus } from '~/components/colored-chip/colored-chip.helper';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import {
  ImportFileDialogComponent,
  ImportFileDialogFormGroup,
} from '~/components/import-file-dialog/import-file-dialog.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { Registration } from '~/domains/registration/registration.model';
import { DownloadService } from '~/services/download.service';
import { ExportService } from '~/services/export.service';
import { ActionDataWithPaginateQuery } from '~/services/paginate-query.service';
import { RegistrationsTableColumnService } from '~/services/registrations-table-column.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type UpdateRegistrationsFormGroup =
  (typeof ImportRegistrationsComponent)['prototype']['updateRegistrationsFormGroup'];

@Component({
  selector: 'app-import-registrations',
  imports: [
    ButtonModule,
    ButtonMenuComponent,
    ImportFileDialogComponent,
    ColoredChipComponent,
    FormFieldWrapperComponent,
    MultiSelectModule,
    ReactiveFormsModule,
  ],
  providers: [ToastService],
  templateUrl: './import-registrations.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportRegistrationsComponent {
  readonly projectId = input.required<string>();
  readonly getActionData =
    input.required<
      () => ActionDataWithPaginateQuery<Registration> | undefined
    >();

  readonly queryClient = inject(QueryClient);
  readonly downloadService = inject(DownloadService);
  readonly exportService = inject(ExportService);
  readonly registrationApiService = inject(RegistrationApiService);
  readonly rtlHelper = inject(RtlHelperService);
  readonly toastService = inject(ToastService);
  readonly registrationsTableColumnService = inject(
    RegistrationsTableColumnService,
  );

  readonly importNewRegistrationsDialogVisible = model<boolean>(false);
  readonly updateExistingRegistrationsDialogVisible = model<boolean>(false);

  readonly updateSelectedRegistrationsActionData = signal<
    ActionDataWithPaginateQuery<Registration> | undefined
  >(undefined);

  protected tableColumns = injectQuery(
    this.registrationsTableColumnService.getColumns(this.projectId),
  );

  readonly updateRegistrationsFieldOptions = computed(() =>
    (this.tableColumns.data() ?? []).filter(
      (column) => !!column.field && column.field !== 'phoneNumber',
    ),
  );

  readonly importOptions = computed<MenuItem[]>(() => [
    {
      label: $localize`New registrations`,
      command: () => {
        this.importNewRegistrationsDialogVisible.set(true);
      },
    },
    {
      label: $localize`Update existing registrations`,
      command: () => {
        const actionData = this.getActionData()();
        if (!actionData) {
          return;
        }
        this.updateSelectedRegistrationsActionData.set(actionData);
        this.updateExistingRegistrationsDialogVisible.set(true);
      },
    },
  ]);

  readonly registeredChipData = getChipDataByRegistrationStatus(
    RegistrationStatusEnum.registered,
  );

  updateRegistrationsFormGroup = new FormGroup({
    fields: new FormControl<string[]>([], {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required, Validators.minLength(1)],
      nonNullable: true,
    }),
  });

  updateRegistrationsFormFieldErrors =
    generateFieldErrors<UpdateRegistrationsFormGroup>(
      this.updateRegistrationsFormGroup,
      {
        fields: genericFieldIsRequiredValidationMessage,
      },
    );

  exportRegistrationsMutation = injectMutation(() => ({
    mutationFn: this.exportService.getExportListMutation(
      this.projectId,
      this.toastService,
    ),
    onSuccess: ({ exportResult: file, filename }) => {
      this.downloadService.downloadFile({ file, filename });
    },
  }));

  downloadImportRegistrationsTemplateMutation = injectMutation(() => ({
    mutationFn: () =>
      this.queryClient.fetchQuery(
        this.registrationApiService.getImportTemplate(this.projectId)(),
      ),
    onSuccess: (csvContents) => {
      this.downloadService.downloadStringArrayToCSV({
        file: csvContents,
        filename: 'import-as-registered-TEMPLATE',
      });
    },
  }));

  importRegistrationsMutation = injectMutation(() => ({
    mutationFn: (
      formValues: ReturnType<ImportFileDialogFormGroup['getRawValue']>,
    ) => {
      const { file } = formValues;

      if (!file) {
        // Should never happen but makes TS happy
        throw new Error('File is required');
      }

      return this.registrationApiService.importRegistrations({
        projectId: this.projectId,
        file,
      });
    },
    onSuccess: () => {
      void this.registrationApiService.invalidateCache({
        projectId: this.projectId,
      });
      this.importNewRegistrationsDialogVisible.set(false);
      this.toastService.showToast({
        summary: $localize`:@@import-registrations-success:Registration(s) imported successfully.`,
      });
    },
  }));

  exportCSVForUpdateRegistrations() {
    this.updateRegistrationsFormGroup.markAllAsTouched();

    if (!this.updateRegistrationsFormGroup.valid) {
      return;
    }

    const selectedFields =
      this.updateRegistrationsFormGroup.getRawValue().fields;

    console.log('Selected fields:', selectedFields);

    // XXX: calling the wrong export function
    this.exportRegistrationsMutation.mutate({
      type: ExportType.allRegistrations,
      paginateQuery: {
        ...this.updateSelectedRegistrationsActionData()?.query,
        select: selectedFields,
      },
    });
  }
}
