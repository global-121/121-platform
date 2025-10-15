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

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import { CreateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration-property.dto';

import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { PageLayoutProjectSettingsComponent } from '~/components/page-layout-project-settings/page-layout-project-settings.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { getFspSettingByName } from '~/domains/fsp/fsp.helper';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { FspConfigurationComponent } from '~/pages/project-settings-fsps/components/fsp-configuration/fsp-configuration.component';
import { FspConfigurationPropertyFormFieldComponent } from '~/pages/project-settings-fsps/components/fsp-configuration-property-form-field/fsp-configuration-property-form-field.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { RegistrationAttributeService } from '~/services/registration-attribute.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';

type FspConfigurationFormGroupControls = {
  displayName: FormControl<string>;
} & Partial<
  Record<FspConfigurationProperties, FormControl<string | string[] | undefined>>
>;

@Component({
  selector: 'app-project-settings-fsps',
  imports: [
    PageLayoutProjectSettingsComponent,
    CardModule,
    ButtonModule,
    TranslatableStringPipe,
    FormDialogComponent,
    ReactiveFormsModule,
    SkeletonInlineComponent,
    FormErrorComponent,
    FspConfigurationComponent,
    CardWithLinkComponent,
    FspConfigurationPropertyFormFieldComponent,
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
  readonly Fsps = Fsps;

  readonly forceAddAnotherFsp = signal(false);
  private readonly fspToConfigure = signal<Fsps>(Fsps.excel);
  private readonly fspConfigurationNameToReconfigure = signal<
    string | undefined
  >(undefined);

  readonly fspConfigurationDialog = viewChild.required<FormDialogComponent>(
    'fspConfigurationDialog',
  );

  fspConfigurations = injectQuery(
    this.fspConfigurationApiService.getFspConfigurations(this.projectId),
  );

  readonly formGroup = computed(() => {
    const fspSetting = this.fspSettingToConfigure();

    // Every fsp-specific formGroup needs to have a displayName field...
    const baseFormGroupControl = {
      displayName: new FormControl(fspSetting.defaultLabel.en ?? '', {
        nonNullable: true,
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        validators: [Validators.required],
      }),
    };

    return new FormGroup<FspConfigurationFormGroupControls>(
      // ...and on top of the displayName, we add each configuration property
      fspSetting.configurationProperties.reduce(
        (acc, property) => ({
          ...acc,
          [property.name]: new FormControl<string | string[]>('', {
            nonNullable: true,
            // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
            validators: property.isRequired ? [Validators.required] : [],
          }),
        }),
        baseFormGroupControl,
      ),
    );
  });

  readonly fspSettingToConfigure = computed(() => {
    const fspSetting = getFspSettingByName(this.fspToConfigure());

    if (!fspSetting) {
      throw new Error('Should never happen but keeps TS happy');
    }

    return fspSetting;
  });

  // XXX: duplicate this for reconfigure scenario
  createFinancialServiceProvidersConfiguration = injectMutation(() => ({
    mutationFn: async (
      formGroupData: ReturnType<
        FormGroup<FspConfigurationFormGroupControls>['getRawValue']
      >,
    ) => {
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

      return this.fspConfigurationApiService.createFspConfiguration(
        this.projectId,
        {
          name: formGroupData.displayName,
          label: {
            en: formGroupData.displayName,
          },
          fspName,
          properties,
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
    this.fspToConfigure.set(fsp);
    this.fspConfigurationNameToReconfigure.set(fspConfigurationName);
    this.fspConfigurationDialog().show({
      resetMutation: true,
    });
  }

  hasFspConfiguration(fspName: Fsps) {
    return this.fspConfigurations
      .data()
      ?.some((fspConfiguration) => fspConfiguration.fspName === fspName);
  }
}
