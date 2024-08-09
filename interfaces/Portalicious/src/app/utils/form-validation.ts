import { FormGroup } from '@angular/forms';

export function generateFieldErrors<T extends FormGroup>(
  formGroup: T,
  validationFn: (
    controlName: keyof T['controls'] & string,
  ) => string | undefined,
) {
  return function (controlName: keyof T['controls'] & string) {
    const control = formGroup.controls[controlName];
    if (!control.touched) {
      return undefined;
    }
    return validationFn(controlName);
  };
}
