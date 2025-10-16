import { computed } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

import { get } from 'radashi';

const genericValidationMessage = (control: AbstractControl) => {
  if (!control.invalid) {
    return;
  }

  if (control.errors?.min) {
    const min = get(control.errors.min, 'min') ?? 0;
    return $localize`This field needs to be at least ${min}.`;
  }

  if (control.errors?.max) {
    const max = get(control.errors.max, 'max') ?? 0;
    return $localize`This field cannot be more than ${max}.`;
  }

  if (control.errors?.minlength) {
    const minlength = get(control.errors.minlength, 'requiredLength') ?? 0;
    return $localize`This field cannot be shorter than ${minlength} characters.`;
  }

  if (control.errors?.maxlength) {
    const maxlength = get(control.errors.maxlength, 'requiredLength') ?? 0;
    return $localize`This field cannot be longer than ${maxlength} characters.`;
  }

  if (control.errors?.email) {
    return $localize`Enter a valid email address`;
  }

  if (control.errors?.required) {
    return $localize`:@@generic-required-field:This field is required.`;
  }

  console.error('Validation errors: ', JSON.stringify(control.errors));
  return $localize`An unknown validation error has been found. Check the console for more details.`;
};

/**
 * Generate field error messages for a FormGroup.
 *
 * @param formGroup The FormGroup for which to generate field error messages
 * @param validationFuncMapping optional mapping of control names to custom validation functions. For controls not in this mapping, a generic default validation message function will be used.
 * @returns A function that takes a control name and returns the corresponding error message, if any
 */
export const generateFieldErrors = <T extends FormGroup>(
  formGroup: T,
  validationFuncMapping: {
    [K in keyof T['controls']]?: (
      control: T['controls'][K],
    ) => string | undefined;
  } = {},
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

        const validationFunc =
          validationFuncMapping[controlName] ?? genericValidationMessage;

        return validationFunc(control);
      },
  );
