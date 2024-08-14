import { computed } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

export function genericFieldIsRequiredValidationMessage(
  control: AbstractControl,
) {
  if (!control.invalid) {
    return;
  }
  return $localize`:@@generic-required-field:This field is required.`;
}

export function generateFieldErrors<T extends FormGroup>(
  formGroup: T,
  validationFuncMapping: {
    [K in keyof T['controls']]: (
      control: T['controls'][K],
    ) => string | undefined;
  },
) {
  return computed(
    () =>
      function (controlName: keyof T['controls'] & string) {
        const control = formGroup.controls[
          controlName
        ] as T['controls'][keyof T['controls'] & string];
        if (!control.touched) {
          return undefined;
        }
        return validationFuncMapping[controlName](control);
      },
  );
}
