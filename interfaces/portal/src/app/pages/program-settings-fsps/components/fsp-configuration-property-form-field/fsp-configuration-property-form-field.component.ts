import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { sensitivePropertyString } from '@121-service/src/program-fsp-configurations/const/sensitive-property-string.const';

import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { FSP_CONFIGURATION_PROPERTY_LABELS } from '~/domains/fsp-configuration/fsp-configuration.helper';
import { FspFormField } from '~/domains/fsp-configuration/fsp-configuration.model';
import { FspConfigurationPropertyInputType } from '~/domains/fsp-configuration/fsp-configuration.model';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { FspConfigurationService } from '~/services/fsp-configuration.service';

@Component({
  selector: 'app-fsp-configuration-property-form-field',
  imports: [
    FormFieldWrapperComponent,
    ReactiveFormsModule,
    MultiSelectModule,
    SelectModule,
    InputTextModule,
    ToggleSwitchModule,
  ],
  templateUrl: './fsp-configuration-property-form-field.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FspConfigurationPropertyFormFieldComponent {
  readonly FspConfigurationPropertyInputType =
    FspConfigurationPropertyInputType;

  readonly programId = input.required<number | string>();
  readonly formGroup = input.required<FormGroup>();
  readonly fspFormField = input.required<FspFormField>();

  readonly fspConfigurationService = inject(FspConfigurationService);
  readonly programApiService = inject(ProgramApiService);

  programAttributes = injectQuery(
    this.programApiService.getProgramAttributes({
      programId: this.programId,
      includeProgramRegistrationAttributes: true,
    }),
  );

  readonly label = computed(() => {
    const propertyName = this.fspFormField().name;
    if (propertyName === 'displayName') {
      return $localize`Display name`;
    }
    return FSP_CONFIGURATION_PROPERTY_LABELS[propertyName];
  });

  readonly labelTooltip = computed(() =>
    this.fspFormField().isSensitive
      ? $localize`This is a sensitive property, therefore its value needs to be re-entered upon reconfiguration.`
      : undefined,
  );

  readonly inputTextPlaceholder = computed(() =>
    this.fspFormField().isSensitive ? sensitivePropertyString : '',
  );

  readonly fieldType = computed(() =>
    this.fspConfigurationService.getPropertyFieldType(this.fspFormField().name),
  );

  // We can't use the generic function here because of how ReactiveForms don't play well with signals,
  // so the workaround is to access the control state in the template,
  // where reactivity on checking invalid/touched works as expected.
  readonly errorMessage = computed(
    () => $localize`:@@generic-required-field:This field is required.`,
  );
}
