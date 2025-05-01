import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

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
  FinancialServiceProviderConfigurationProperties,
  FinancialServiceProviders,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FINANCIAL_SERVICE_PROVIDER_SETTINGS } from '@121-service/src/financial-service-providers/financial-service-providers-settings.const';

import { AppRoutes } from '~/app.routes';
import { CardWithButtonComponent } from '~/components/card-with-button/card-with-button.component';
import { FormSidebarComponent } from '~/components/form/form-sidebar.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProjectSettingsPageLayoutComponent } from '~/components/project-settings-page-layout/project-settings-page-layout.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { FINANCIAL_SERVICE_PROVIDER_CONFIGURATION_PROPERTY_LABELS } from '~/domains/financial-service-provider/financial-service-provider.helper';
import { FinancialServiceProviderConfigurationApiService } from '~/domains/financial-service-provider-configuration/financial-service-provider-configuration.api.service';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { FinancialServiceProviderConfigurationComponent } from '~/pages/project-settings-financial-service-providers/components/financial-service-provider-configuration/financial-service-provider-configuration.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import { genericFieldIsRequiredValidationMessage } from '~/utils/form-validation';

@Component({
  selector: 'app-project-settings-financial-service-providers',
  imports: [
    ProjectSettingsPageLayoutComponent,
    CardModule,
    ButtonModule,
    TranslatableStringPipe,
    FormSidebarComponent,
    FormFieldWrapperComponent,
    InputTextModule,
    ReactiveFormsModule,
    CardWithButtonComponent,
    SkeletonInlineComponent,
    FormErrorComponent,
    FinancialServiceProviderConfigurationComponent,
    RouterLink,
    MultiSelectModule,
    SelectModule,
  ],
  templateUrl: './project-settings-financial-service-providers.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class ProjectSettingsFinancialServiceProvidersPageComponent {
  readonly projectId = input.required<string>();

  financialServiceProviderConfigurationApiService = inject(
    FinancialServiceProviderConfigurationApiService,
  );
  projectApiService = inject(ProjectApiService);
  rtlHelper = inject(RtlHelperService);
  toastService = inject(ToastService);

  readonly financialServiceProviders = FINANCIAL_SERVICE_PROVIDER_SETTINGS;
  FinancialServiceProviders = FinancialServiceProviders;
  AppRoutes = AppRoutes;

  readonly currentlyEditedFsp = model<FinancialServiceProviders | undefined>(
    undefined,
  );
  readonly forceAddAnotherFsp = model(false);

  formGroups = FINANCIAL_SERVICE_PROVIDER_SETTINGS.reduce(
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
    {} as Record<FinancialServiceProviders, FormGroup>,
  );

  financialServiceProviderConfigurations = injectQuery(
    this.financialServiceProviderConfigurationApiService.getFinancialServiceProviderConfigurations(
      this.projectId,
    ),
  );
  projectAttributes = injectQuery(
    this.projectApiService.getProjectAttributes({
      projectId: this.projectId,
      includeProgramRegistrationAttributes: true,
    }),
  );

  createFinancialServiceProvidersConfiguration = injectMutation(() => ({
    mutationFn: async (formGroupData: Record<string, string | undefined>) => {
      console.log(formGroupData);

      const fspSettings = FINANCIAL_SERVICE_PROVIDER_SETTINGS.find(
        (fsp) => fsp.name === this.currentlyEditedFsp(),
      );

      if (!fspSettings) {
        throw new Error('FSP settings not found'); // Should never happen
      }

      return this.financialServiceProviderConfigurationApiService.createFinancialServiceProviderConfiguration(
        this.projectId,
        {
          name: formGroupData.displayName ?? fspSettings.name,
          label: {
            en: formGroupData.displayName,
          },
          isDefault: true,
          financialServiceProviderName: fspSettings.name,
          properties: fspSettings.configurationProperties
            .map((property) => ({
              name: property.name,
              // XXX: always a string for now, but should be possible to send an array of strings
              value: formGroupData[property.name],
            }))
            .filter((property) => property.value !== undefined) as {
            name: FinancialServiceProviderConfigurationProperties;
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
      // XXX: invalidate cache for attributes

      this.forceAddAnotherFsp.set(false);
      this.currentlyEditedFsp.set(undefined);
    },
    onError: (error) => {
      this.toastService.showToast({
        severity: 'error',
        detail: error.message,
      });
    },
  }));

  getPropertyLabel({
    name,
    isRequired,
  }: {
    name: FinancialServiceProviderConfigurationProperties;
    isRequired: boolean;
  }) {
    return `${
      isRequired ? '*' : ''
    }${FINANCIAL_SERVICE_PROVIDER_CONFIGURATION_PROPERTY_LABELS[name]} (${
      isRequired ? $localize`required` : $localize`optional`
    })`;
  }

  getPropertyErrorMessage(
    formGroup: FormGroup,
    {
      name,
      isRequired,
    }: {
      name: 'displayName' | FinancialServiceProviderConfigurationProperties;
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

    return genericFieldIsRequiredValidationMessage(control);
  }

  hasFspConfiguration(fspName: FinancialServiceProviders) {
    return this.financialServiceProviderConfigurations
      .data()
      ?.some(
        (fspConfiguration) =>
          fspConfiguration.financialServiceProviderName === fspName,
      );
  }
}
