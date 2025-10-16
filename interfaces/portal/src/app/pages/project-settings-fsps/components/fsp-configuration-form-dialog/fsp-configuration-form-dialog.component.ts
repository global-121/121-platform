import { NgTemplateOutlet } from '@angular/common';
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

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { sensitivePropertyString } from '@121-service/src/program-fsp-configurations/const/sensitive-property-string.const';
import { CreateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration-property.dto';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { getFspSettingByName } from '~/domains/fsp/fsp.helper';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { FspConfiguration } from '~/domains/fsp-configuration/fsp-configuration.model';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { FspConfigurationPropertyFormFieldComponent } from '~/pages/project-settings-fsps/components/fsp-configuration-property-form-field/fsp-configuration-property-form-field.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { ToastService } from '~/services/toast.service';

type FspConfigurationControls = {
  displayName: FormControl<string>;
} & Partial<
  Record<FspConfigurationProperties, FormControl<string | string[] | undefined>>
>;

@Component({
  selector: 'app-fsp-configuration-form-dialog',
  imports: [
    FormDialogComponent,
    FspConfigurationPropertyFormFieldComponent,
    TranslatableStringPipe,
    ReactiveFormsModule,
    NgTemplateOutlet,
  ],
  templateUrl: './fsp-configuration-form-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class FspConfigurationFormDialogComponent {
  readonly projectId = input.required<string>();
  readonly configurationCompleted = output();

  readonly fspConfigurationApiService = inject(FspConfigurationApiService);
  readonly toastService = inject(ToastService);
  readonly projectApiService = inject(ProjectApiService);

  projectAttributes = injectQuery(
    this.projectApiService.getProjectAttributes({
      projectId: this.projectId,
      includeProgramRegistrationAttributes: true,
    }),
  );

  // XXX: save the FSP setting directly once the FSP_SETTINGS business is in order
  private readonly fspToConfigure = signal<Fsps>(Fsps.excel);
  private readonly fspConfigurationToReconfigure = signal<
    FspConfiguration | undefined
  >(undefined);

  readonly configurationDialog = viewChild.required<FormDialogComponent>(
    'configurationDialog',
  );
  readonly integrationErrorDialog = viewChild.required<FormDialogComponent>(
    'integrationErrorDialog',
  );

  readonly formGroup = computed<FormGroup<FspConfigurationControls>>(() => {
    const fspSetting = this.fspSettingToConfigure();

    const existingFspConfiguration = this.fspConfigurationToReconfigure();

    const defaultDisplayNameValue = existingFspConfiguration
      ? (existingFspConfiguration.label.en ?? '')
      : (fspSetting.defaultLabel.en ?? '');

    const formGroupControls: FspConfigurationControls = {
      displayName: new FormControl(defaultDisplayNameValue, {
        nonNullable: true,
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        validators: [Validators.required],
      }),
    };

    fspSetting.configurationProperties.forEach((property) => {
      let existingPropertyValue = existingFspConfiguration?.properties.find(
        (p) => p.name === property.name,
      )?.value;

      if (this.isSensitiveProperty()(property.name)) {
        existingPropertyValue = '';
      }

      formGroupControls[property.name] = new FormControl<string | string[]>(
        existingPropertyValue ?? '',
        {
          nonNullable: true,
          // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
          validators: property.isRequired ? [Validators.required] : [],
        },
      );
    });

    return new FormGroup(formGroupControls);
  });

  readonly fspSettingToConfigure = computed(() => {
    const fspSetting = getFspSettingByName(this.fspToConfigure());

    if (!fspSetting) {
      throw new Error('Should never happen but keeps TS happy');
    }

    return fspSetting;
  });

  readonly missingIntegrationAttributes = computed(() => {
    const fspSetting = this.fspSettingToConfigure();

    const requiredAttributes = fspSetting.attributes.filter(
      (property) => property.isRequired,
    );

    return requiredAttributes.filter(
      (attribute) =>
        !this.projectAttributes
          .data()
          ?.some(
            (projectAttribute) =>
              projectAttribute.name === attribute.name.toString(),
          ),
    );
  });

  readonly isSensitiveProperty = computed(
    () => (propertyName: FspConfigurationProperties) =>
      this.fspConfigurationToReconfigure()?.properties.find(
        (p) => p.name === propertyName,
      )?.value === sensitivePropertyString,
  );

  configureFsp = injectMutation(() => ({
    mutationFn: async (
      formGroupData: ReturnType<
        FormGroup<FspConfigurationControls>['getRawValue']
      >,
    ) => {
      // TODO: AB#35944 - Once we have implemented KOBO integration via the UI, this should become
      // if (this.missingIntegrationAttributes().length > 0 && this.hasKoboIntegration()) {
      // TODO: AB#35935 - Once we have implemented automatic registration attribute creation, this check should disappear altogether
      if (this.missingIntegrationAttributes().length > 0) {
        this.configurationDialog().hide({ resetFormGroup: false });
        this.integrationErrorDialog().show();
        throw new Error(
          $localize`Missing required attributes for FSP integration. Please add them to the project registration form before trying again.`,
        );
      }

      const { configurationProperties, name: fspName } =
        this.fspSettingToConfigure();

      const properties = configurationProperties
        .map(({ name }) => ({
          name,
          value: formGroupData[name],
        }))
        .filter(
          (property): property is CreateProgramFspConfigurationPropertyDto =>
            property.value !== undefined,
        );

      const fspConfiguration = {
        // TODO: AB#38589 - edit name separately from display name
        name: formGroupData.displayName,
        label: {
          en: formGroupData.displayName,
        },
        fspName,
        properties,
      };

      const existingFspConfiguration = this.fspConfigurationToReconfigure();

      if (existingFspConfiguration) {
        // set name to the existing value to avoid changing it
        fspConfiguration.name = existingFspConfiguration.name;

        return this.fspConfigurationApiService.updateFspConfiguration({
          projectId: this.projectId,
          configurationName: existingFspConfiguration.name,
          configuration: fspConfiguration,
        });
      }

      return this.fspConfigurationApiService.createFspConfiguration({
        projectId: this.projectId,
        configuration: fspConfiguration,
      });
    },
    onSuccess: () => {
      this.configurationCompleted.emit();
    },
  }));

  retryConfigureFsp = injectMutation(() => ({
    mutationFn: () => {
      this.configurationDialog().show({ resetFormGroup: false });
      return Promise.resolve();
    },
  }));

  show({
    fsp,
    fspConfiguration,
  }: {
    fsp: Fsps;
    fspConfiguration?: FspConfiguration;
  }) {
    this.fspToConfigure.set(fsp);
    this.fspConfigurationToReconfigure.set(fspConfiguration);
    this.configurationDialog().show();
  }
}
