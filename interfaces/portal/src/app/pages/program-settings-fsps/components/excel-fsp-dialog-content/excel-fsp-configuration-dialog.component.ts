import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { dash } from 'radashi';

import { ExcelFspConfigurationResponseDto } from '@121-service/src/fsp-integrations/integrations/excel/dto/excel-fsp-configuration-response.dto';
import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { FspConfiguration } from '~/domains/fsp-configuration/fsp-configuration.model';
import { ExcelFspDialogContentComponent } from '~/pages/program-settings-fsps/components/excel-fsp-dialog-content/excel-fsp-dialog-content.component';
import {
  FspConfigurationFormGroup,
  FspConfigurationService,
} from '~/services/fsp-configuration.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-excel-fsp-configuration-dialog',
  imports: [
    FormDialogComponent,
    ExcelFspDialogContentComponent,
    ManualLinkComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './excel-fsp-configuration-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class ExcelFspConfigurationDialogComponent {
  readonly programId = input.required<string>();
  readonly configurationCompleted = output<FspConfiguration>();

  private readonly fspConfigurationApiService = inject(
    FspConfigurationApiService,
  );
  private readonly fspConfigurationService = inject(FspConfigurationService);
  private readonly translatableStringService = inject(
    TranslatableStringService,
  );
  private readonly toastService = inject(ToastService);

  private readonly configurationDialog =
    viewChild.required<FormDialogComponent>('configurationDialog');

  private readonly existingFspConfiguration = signal<
    FspConfiguration | undefined
  >(undefined);

  readonly fspSetting = FSP_SETTINGS[Fsps.excel];
  readonly fspLabel = computed(
    () =>
      this.translatableStringService.translate(this.fspSetting.defaultLabel) ??
      '',
  );
  readonly configurationDialogHeader = computed(() =>
    this.existingFspConfiguration()
      ? $localize`Reconfigure ${this.fspLabel()}:fspName:`
      : $localize`Configure ${this.fspLabel()}:fspName:`,
  );
  readonly configurationProceedLabel = computed(() =>
    this.existingFspConfiguration()
      ? $localize`:@@generic-save-changes:Save changes`
      : $localize`Integrate FSP`,
  );
  readonly formGroup = computed(() =>
    this.fspConfigurationService.fspSettingToFormGroup({
      fspSetting: this.fspSetting,
      existingFspConfiguration: this.existingFspConfiguration(),
    }),
  );
  readonly fspFormFields = computed(() =>
    this.fspConfigurationService.fspSettingToFspFormFields({
      fspSetting: this.fspSetting,
      existingFspConfiguration: this.existingFspConfiguration(),
    }),
  );

  readonly configureExcelFsp = injectMutation(() => ({
    mutationFn: async (
      formGroupData: ReturnType<FspConfigurationFormGroup['getRawValue']>,
    ) => {
      const uniqueIdentifierField = formGroupData.columnToMatch;
      const exportFields = formGroupData.columnsToExport;
      if (
        typeof uniqueIdentifierField !== 'string' ||
        !Array.isArray(exportFields)
      ) {
        throw new TypeError('Invalid Excel configuration fields');
      }

      const configuration = {
        label: { en: formGroupData.displayName },
        uniqueIdentifierField,
        exportFields,
      };
      const existingConfiguration = this.existingFspConfiguration();
      if (existingConfiguration) {
        return this.fspConfigurationApiService.updateExcelFspConfiguration({
          programId: this.programId,
          configurationName: existingConfiguration.name,
          configuration,
        });
      }

      return this.fspConfigurationApiService.createExcelFspConfiguration({
        programId: this.programId,
        configuration: {
          ...configuration,
          name: dash(formGroupData.displayName.trim()),
        },
      });
    },
    onSuccess: (configuration) => {
      this.configurationCompleted.emit(configuration);
    },
    onError: () => {
      this.toastService.showGenericError();
    },
  }));

  public async show({
    fspConfiguration,
  }: {
    fspConfiguration?: FspConfiguration;
  }): Promise<void> {
    let excelFields: ExcelFspConfigurationResponseDto | undefined;
    if (fspConfiguration) {
      try {
        excelFields =
          await this.fspConfigurationApiService.getExcelFspConfiguration({
            programId: this.programId,
            configurationName: fspConfiguration.name,
          });
      } catch {
        this.toastService.showGenericError();
        return;
      }
    }

    this.existingFspConfiguration.set(fspConfiguration);
    this.configurationDialog().show();
    if (excelFields) {
      this.formGroup().patchValue({
        columnToMatch: excelFields.uniqueIdentifierField,
        columnsToExport: excelFields.exportFields,
      });
    }
  }
}
