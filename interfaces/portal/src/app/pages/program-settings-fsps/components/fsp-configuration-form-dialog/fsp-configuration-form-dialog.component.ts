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

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { dash } from 'radashi';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FspDto } from '@121-service/src/fsps/fsp.dto';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
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
  providers: [],
})
export class FspConfigurationFormDialogComponent {
  readonly programId = input.required<string>();
  readonly configurationCompleted = output<FspConfiguration>();

  readonly fspConfigurationService = inject(FspConfigurationService);
  readonly fspConfigurationApiService = inject(FspConfigurationApiService);
  readonly programApiService = inject(ProgramApiService);
  readonly translatableStringService = inject(TranslatableStringService);

  programAttributes = injectQuery(
    this.programApiService.getProgramAttributes({
      programId: this.programId,
      includeProgramRegistrationAttributes: true,
    }),
  );

  readonly configurationDialog = viewChild.required<FormDialogComponent>(
    'configurationDialog',
  );
  readonly integrationErrorDialog = viewChild.required<FormDialogComponent>(
    'integrationErrorDialog',
  );

  // This is defaulted to Excel to avoid undefined errors before show() is called
  // It could default to anything really, as show() will always be called first
  readonly fspSetting = signal<FspDto>(FSP_SETTINGS[Fsps.excel]);
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
    const title = this.existingFspConfiguration()
      ? $localize`Reconfigure`
      : $localize`Configure`;

    return `${title} ${this.fspLabel()}`;
  });

  readonly missingIntegrationAttributes = computed(() =>
    this.fspConfigurationService.getMissingRequiredAttributes({
      fspSetting: this.fspSetting(),
      programAttributes: this.programAttributes.data() ?? [],
    }),
  );

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
      // TODO: AB#35944 - Once we have implemented KOBO integration via the UI, this should become
      // if (this.missingIntegrationAttributes().length > 0 && this.hasKoboIntegration()) {
      // TODO: AB#35935 - Once we have implemented automatic registration attribute creation, this check should disappear altogether
      if (this.missingIntegrationAttributes().length > 0) {
        this.configurationDialog().hide({ resetFormGroup: false });
        this.integrationErrorDialog().show();
        throw new Error(
          $localize`Missing required attributes for FSP integration. Please add them to the program registration form before trying again.`,
        );
      }

      const { configurationProperties, name: fspName } = this.fspSetting();

      const fspConfiguration = {
        // TODO: AB#38589 - edit name separately from display name
        name: dash(formGroupData.displayName),
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
  }));

  retryConfigureFsp = injectMutation(() => ({
    mutationFn: () => {
      this.configurationDialog().show({ resetFormGroup: false });
      return Promise.resolve();
    },
  }));

  show({
    fspSetting,
    fspConfiguration,
  }: {
    fspSetting: FspDto;
    fspConfiguration?: FspConfiguration;
  }) {
    this.fspSetting.set(fspSetting);
    this.existingFspConfiguration.set(fspConfiguration);
    this.configurationDialog().show();
  }
}
