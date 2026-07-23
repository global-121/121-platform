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

import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';
import { CreateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration-property.dto';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { FspConfiguration } from '~/domains/fsp-configuration/fsp-configuration.model';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { FspConfigurationPropertyFormFieldComponent } from '~/pages/program-settings-fsps/components/fsp-configuration-property-form-field/fsp-configuration-property-form-field.component';
import {
  FspConfigurationFormGroup,
  FspConfigurationService,
} from '~/services/fsp-configuration.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-fsp-configuration-form-dialog',
  imports: [
    FormDialogComponent,
    FspConfigurationPropertyFormFieldComponent,
    ReactiveFormsModule,
    ManualLinkComponent,
  ],
  templateUrl: './fsp-configuration-form-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class FspConfigurationFormDialogComponent {
  readonly programId = input.required<string>();
  readonly configurationCompleted = output<FspConfiguration>();

  readonly fspConfigurationService = inject(FspConfigurationService);
  readonly fspConfigurationApiService = inject(FspConfigurationApiService);
  readonly translatableStringService = inject(TranslatableStringService);

  readonly programApiService = inject(ProgramApiService);
  readonly toastService = inject(ToastService);

  readonly configurationDialog = viewChild.required<FormDialogComponent>(
    'configurationDialog',
  );

  // This is defaulted to Excel to avoid undefined errors before show() is called
  // It could default to anything really, as show() will always be called first
  readonly fspSetting = signal(FSP_SETTINGS[Fsps.excel]);
  // If this is undefined, it is because we are adding a new FSP configuration
  // (not reconfiguring one)
  readonly existingFspConfiguration = signal<FspConfiguration | undefined>(
    undefined,
  );

  readonly fspLabel = computed(
    () =>
      this.translatableStringService.translate(
        this.fspSetting().defaultLabel,
      ) ?? '',
  );

  readonly configurationDialogHeader = computed(() => {
    return this.existingFspConfiguration()
      ? $localize`Reconfigure ${this.fspLabel()}:fspName:`
      : $localize`Configure ${this.fspLabel()}:fspName:`;
  });

  readonly configurationProceedLabel = computed(() => {
    return this.existingFspConfiguration()
      ? $localize`:@@generic-save-changes:Save changes`
      : $localize`Integrate FSP`;
  });

  readonly formGroup = computed<FspConfigurationFormGroup>(() =>
    this.fspConfigurationService.fspSettingToFormGroup({
      fspSetting: this.fspSetting(),
      existingFspConfiguration: this.existingFspConfiguration(),
    }),
  );

  readonly fspFormFields = computed(() =>
    this.fspConfigurationService.fspSettingToFspFormFields({
      fspSetting: this.fspSetting(),
      existingFspConfiguration: this.existingFspConfiguration(),
    }),
  );

  configureFsp = injectMutation(() => ({
    mutationFn: async (
      formGroupData: ReturnType<FspConfigurationFormGroup['getRawValue']>,
    ) => {
      const { configurationProperties, name: fspName } = this.fspSetting();

      const fspConfiguration = {
        // TODO: AB#38589 - edit name separately from display name
        name: dash(formGroupData.displayName.trim()),
        label: {
          // Intentionally using 'en' here, as we don't actually want to translate the display name
          en: formGroupData.displayName,
        },
        fspName,
        properties: configurationProperties
          .map(({ name }) => ({
            name,
            value: formGroupData[name],
          }))
          .filter(
            (property): property is CreateProgramFspConfigurationPropertyDto =>
              property.value !== undefined,
          ),
      };

      const existingFspConfiguration = this.existingFspConfiguration();

      if (existingFspConfiguration) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- we need to exclude name from updateFspConfigurationDto
        const { name, ...updateFspConfigurationDto } = fspConfiguration;

        return this.fspConfigurationApiService.updateFspConfiguration({
          programId: this.programId,
          configurationName: existingFspConfiguration.name,
          configuration: updateFspConfigurationDto,
        });
      }

      return this.fspConfigurationApiService.createFspConfiguration({
        programId: this.programId,
        configuration: fspConfiguration,
      });
    },
    onSuccess: (fspConfiguration) => {
      this.configurationCompleted.emit(fspConfiguration);
    },
    onError: () => {
      this.toastService.showGenericError();
    },
  }));

  show({
    fspSetting,
    fspConfiguration,
  }: {
    fspSetting: FspSettingsDto;
    fspConfiguration?: FspConfiguration;
  }) {
    this.fspSetting.set(fspSetting);
    this.existingFspConfiguration.set(fspConfiguration);
    this.configurationDialog().show();
  }
}
