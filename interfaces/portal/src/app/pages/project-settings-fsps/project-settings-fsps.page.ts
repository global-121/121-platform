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
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';

import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { PageLayoutProjectSettingsComponent } from '~/components/page-layout-project-settings/page-layout-project-settings.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import {
  FSP_CONFIGURATION_PROPERTY_LABELS,
  getFspSettingByName,
} from '~/domains/fsp/fsp.helper';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { FspConfigurationComponent } from '~/pages/project-settings-fsps/components/fsp-configuration/fsp-configuration.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { RegistrationAttributeService } from '~/services/registration-attribute.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import { genericValidationMessage } from '~/utils/form-validation';

@Component({
  selector: 'app-project-settings-fsps',
  imports: [
    PageLayoutProjectSettingsComponent,
    CardModule,
    ButtonModule,
    TranslatableStringPipe,
    FormDialogComponent,
    FormFieldWrapperComponent,
    InputTextModule,
    ReactiveFormsModule,
    SkeletonInlineComponent,
    FormErrorComponent,
    FspConfigurationComponent,
    MultiSelectModule,
    SelectModule,
    CardWithLinkComponent,
  ],
  templateUrl: './project-settings-fsps.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class ProjectSettingsFspsPageComponent {
  readonly projectId = input.required<string>();

  readonly fspConfigurationApiService = inject(FspConfigurationApiService);
  readonly projectApiService = inject(ProjectApiService);
  readonly registrationAttributeService = inject(RegistrationAttributeService);
  readonly rtlHelper = inject(RtlHelperService);
  readonly toastService = inject(ToastService);

  readonly FSP_SETTINGS = FSP_SETTINGS;
  readonly FSP_CONFIGURATION_PROPERTY_LABELS =
    FSP_CONFIGURATION_PROPERTY_LABELS;
  readonly Fsps = Fsps;

  readonly forceAddAnotherFsp = signal(false);
  private readonly currentlyConfiguredFsp = signal<Fsps>(Fsps.excel);
  private readonly fspConfigurationNameToReconfigure = signal<
    string | undefined
  >(undefined);

  readonly fspConfigurationDialog = viewChild.required<FormDialogComponent>(
    'fspConfigurationDialog',
  );

  private formGroupPerFspSetting = FSP_SETTINGS.reduce<Record<Fsps, FormGroup>>(
    (acc, fsp) => ({
      ...acc,
      [fsp.name]: new FormGroup<Record<string, FormControl<string>>>(
        fsp.configurationProperties.reduce(
          (acc, property) => ({
            ...acc,
            [property.name]: new FormControl('', {
              nonNullable: true,
              // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
              validators: property.isRequired ? [Validators.required] : [],
            }),
          }),
          {
            displayName: new FormControl(fsp.defaultLabel.en ?? '', {
              nonNullable: true,
              // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
              validators: [Validators.required],
            }),
          },
        ),
      ),
    }),
    // XXX: can we do better than this?
    {} as Record<Fsps, FormGroup>,
  );

  fspConfigurations = injectQuery(
    this.fspConfigurationApiService.getFspConfigurations(this.projectId),
  );
  projectAttributes = injectQuery(
    this.projectApiService.getProjectAttributes({
      projectId: this.projectId,
      includeProgramRegistrationAttributes: true,
    }),
  );

  readonly formGroup = computed(
    () => this.formGroupPerFspSetting[this.currentlyConfiguredFsp()],
  );
  readonly formFspSetting = computed(() =>
    getFspSettingByName(this.currentlyConfiguredFsp()),
  );

  // XXX: duplicate this for reconfigure scenario
  createFinancialServiceProvidersConfiguration = injectMutation(() => ({
    mutationFn: async (formGroupData: Record<string, string | undefined>) => {
      const fspSettings = FSP_SETTINGS.find(
        (fsp) => fsp.name === this.currentlyConfiguredFsp(),
      );

      if (!fspSettings) {
        throw new Error('FSP settings not found'); // Should never happen
      }

      return this.fspConfigurationApiService.createFspConfiguration(
        this.projectId,
        {
          name: formGroupData.displayName ?? fspSettings.name,
          label: {
            en: formGroupData.displayName,
          },
          fspName: fspSettings.name,
          properties: fspSettings.configurationProperties
            .map((property) => ({
              name: property.name,
              // XXX: always a string for now, but should be possible to send an array of strings
              value: formGroupData[property.name],
            }))
            .filter((property) => property.value !== undefined) as {
            name: FspConfigurationProperties;
            value: string;
          }[],
        },
      );
    },
    onSuccess: async () => {
      this.toastService.showToast({
        detail: $localize`FSP integrated successfully.`,
      });

      await this.projectApiService.invalidateCache();

      this.forceAddAnotherFsp.set(false);
    },
    onError: (error) => {
      this.toastService.showToast({
        severity: 'error',
        detail: error.message,
      });
    },
  }));

  showFspConfigurationDialog({
    fsp,
    fspConfigurationName,
  }: {
    fsp: Fsps;
    fspConfigurationName?: string;
  }) {
    this.currentlyConfiguredFsp.set(fsp);
    this.fspConfigurationNameToReconfigure.set(fspConfigurationName);
    this.fspConfigurationDialog().show({
      resetMutation: true,
    });
  }

  getFspConfigurationPropertyErrorMessage(
    formGroup: FormGroup,
    {
      name,
      isRequired,
    }: {
      name: 'displayName' | FspConfigurationProperties;
      isRequired: boolean;
    },
  ) {
    if (!isRequired) {
      return undefined;
    }

    const control = formGroup.get(name);

    if (!control?.touched) {
      return undefined;
    }

    return genericValidationMessage(control);
  }

  hasFspConfiguration(fspName: Fsps) {
    return this.fspConfigurations
      .data()
      ?.some((fspConfiguration) => fspConfiguration.fspName === fspName);
  }
}
