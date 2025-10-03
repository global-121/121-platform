import { computed } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

import { get } from 'radashi';

export const genericValidationMessage = (control: AbstractControl) => {
  if (!control.invalid) {
    return;
  }

  if (control.errors?.min) {
    const min = get(control.errors.min, 'min') ?? 0;
    return $localize`This field needs to be at least ${min}.`;
  }

  if (control.errors?.max) {
    const max = get(control.errors.max, 'max') ?? 0;
    return $localize`This field needs to be at most ${max}.`;
  }

  if (control.errors?.minlength) {
    const min = get(control.errors.minlength, 'minlength') ?? 0;
    return $localize`This field cannot be shorter than ${min} characters.`;
  }

  if (control.errors?.maxlength) {
    const max = get(control.errors.maxlength, 'requiredLength') ?? 0;
    return $localize`This field cannot be longer than ${max} characters.`;
  }

  if (control.errors?.email) {
    return $localize`Enter a valid email address`;
  }

  if (control.errors?.required) {
    return $localize`:@@generic-required-field:This field is required.`;
  }

  throw new Error(
    `No validation message found for control with errors: ${JSON.stringify(
      control.errors,
    )}`,
  );
};

export const generateFieldErrors = <T extends FormGroup>(
  formGroup: T,
  validationFuncMapping: {
    [K in keyof T['controls']]: (
      control: T['controls'][K],
    ) => string | undefined;
  },
) =>
  computed(
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
