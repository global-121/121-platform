import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { FspFormField } from '~/domains/fsp-configuration/fsp-configuration.model';
import { FspConfigurationPropertyInputComponent } from '~/pages/program-settings-fsps/components/fsp-configuration-property-input/fsp-configuration-property-input.component';
import { FspConfigurationFormGroup } from '~/services/fsp-configuration.service';

@Component({
  selector: 'app-excel-fsp-dialog-content',
  imports: [
    FspConfigurationPropertyInputComponent,
    ReactiveFormsModule,
    FormFieldWrapperComponent,
  ],
  templateUrl: './excel-fsp-dialog-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExcelFspDialogContentComponent {
  readonly programId = input.required<string>();
  readonly formGroup = input.required<FspConfigurationFormGroup>();
  readonly fspFormFields = input.required<FspFormField[]>();

  readonly fspFormFieldByName = computed(() => {
    const map = new Map<
      string,
      { field: FspFormField; control: FormControl | null }
    >();
    for (const field of this.fspFormFields()) {
      map.set(field.name, {
        field,
        control: this.formGroup().get(field.name) as FormControl | null,
      });
    }
    return map;
  });

  readonly requiredErrorMessage = computed(
    () => $localize`:@@generic-required-field:This field is required.`,
  );

  protected isControlInvalidAndTouched(control: FormControl | null): boolean {
    return control !== null && control.invalid && control.touched;
  }
}
