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

import { FspConfigurationProperties } from '@121-service/src/fsps/enums/fsp-name.enum';

import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { FSP_CONFIGURATION_PROPERTY_LABELS } from '~/domains/fsp/fsp.helper';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { genericValidationMessage } from '~/utils/form-validation';

@Component({
  selector: 'app-fsp-configuration-property-form-field',
  imports: [
    FormFieldWrapperComponent,
    ReactiveFormsModule,
    MultiSelectModule,
    SelectModule,
    InputTextModule,
  ],
  templateUrl: './fsp-configuration-property-form-field.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FspConfigurationPropertyFormFieldComponent {
  readonly projectId = input.required<number | string>();
  readonly property = input.required<{
    name: 'displayName' | FspConfigurationProperties;
    isRequired: boolean;
  }>();
  readonly formGroup = input.required<FormGroup>();

  readonly projectApiService = inject(ProjectApiService);

  projectAttributes = injectQuery(
    this.projectApiService.getProjectAttributes({
      projectId: this.projectId,
      includeProgramRegistrationAttributes: true,
    }),
  );

  readonly label = computed(() => {
    const propertyName = this.property().name;
    if (propertyName === 'displayName') {
      return $localize`Display name`;
    }
    return FSP_CONFIGURATION_PROPERTY_LABELS[propertyName];
  });

  readonly fieldType = computed(() => {
    switch (this.property().name) {
      case FspConfigurationProperties.columnsToExport:
        return 'select-multiple';
      case FspConfigurationProperties.columnToMatch:
        return 'select';
      default:
        return 'string';
    }
  });

  readonly errorMessage = computed(() => {
    const { name, isRequired } = this.property();

    if (!isRequired) {
      return undefined;
    }

    const control = this.formGroup().get(name);

    if (!control?.touched) {
      return undefined;
    }

    return genericValidationMessage(control);
  });
}
