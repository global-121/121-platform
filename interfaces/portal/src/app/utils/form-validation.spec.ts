import { FormControl, FormGroup, Validators } from '@angular/forms';

import { generateFieldErrors } from '~/utils/form-validation';

describe('Form Validation Utils', () => {
  describe('generateFieldErrors', () => {
    const formGroup = new FormGroup({
      required: new FormControl('', {
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        validators: [Validators.required],
      }),
      email: new FormControl('invalid-email', {
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        validators: [Validators.email],
      }),
      minLength: new FormControl('a', {
        validators: [Validators.minLength(3)],
      }),
      maxLength: new FormControl('toolong', {
        validators: [Validators.maxLength(5)],
      }),
      min: new FormControl(5, {
        validators: [Validators.min(10)],
      }),
      max: new FormControl(15, {
        validators: [Validators.max(10)],
      }),
      untouchedButRequired: new FormControl<string | undefined>(
        { value: undefined, disabled: false },
        {
          // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
          validators: [Validators.required],
        },
      ),
      customValidation: new FormControl(''),
    });

    beforeEach(() => {
      // Mark all controls as touched except 'untouched'
      Object.keys(formGroup.controls).forEach((key) => {
        if (key !== 'untouchedButRequired') {
          formGroup.get(key)?.markAsTouched();
        }
      });
    });

    it('should return undefined for untouched controls', () => {
      const getFieldError = generateFieldErrors(formGroup)();
      expect(getFieldError('untouchedButRequired')).toBeUndefined();
    });

    it('should return required error message', () => {
      const getFieldError = generateFieldErrors(formGroup)();
      expect(getFieldError('required')).toBe('This field is required.');
    });

    it('should return email error message', () => {
      const getFieldError = generateFieldErrors(formGroup)();
      expect(getFieldError('email')).toBe('Enter a valid email address');
    });

    it('should return minLength error message', () => {
      const getFieldError = generateFieldErrors(formGroup)();
      expect(getFieldError('minLength')).toBe(
        'This field cannot be shorter than 3 characters.',
      );
    });

    it('should return maxLength error message', () => {
      const getFieldError = generateFieldErrors(formGroup)();
      expect(getFieldError('maxLength')).toBe(
        'This field cannot be longer than 5 characters.',
      );
    });

    it('should return min error message', () => {
      const getFieldError = generateFieldErrors(formGroup)();
      expect(getFieldError('min')).toBe('This field needs to be at least 10.');
    });

    it('should return max error message', () => {
      const getFieldError = generateFieldErrors(formGroup)();
      expect(getFieldError('max')).toBe('This field cannot be more than 10.');
    });

    it('should use custom validation function when provided', () => {
      const customValidationMapping = {
        customValidation: () => 'Custom error message',
      };

      const getFieldError = generateFieldErrors(
        formGroup,
        customValidationMapping,
      )();
      expect(getFieldError('customValidation')).toBe('Custom error message');
    });

    it('should use generic validation when custom validation not provided for control', () => {
      const customValidationMapping = {
        email: () => 'Custom email error',
      };

      const getFieldError = generateFieldErrors(
        formGroup,
        customValidationMapping,
      )();
      expect(getFieldError('email')).toBe('Custom email error');
      expect(getFieldError('required')).toBe('This field is required.'); // Should use generic validator
    });

    it('Cannot use custom validation mapping with incorrect control names', () => {
      const customValidationMapping = {
        nonExistentControl: () => 'This should not work',
      };

      // This should not throw, as the mapping key does not correspond to any control
      const getFieldError = generateFieldErrors(
        formGroup,
        // If we ever lose the TS error, that means the typing is broken
        // @ts-expect-error Testing incorrect mapping
        customValidationMapping,
      )();

      // If we ever lose the TS error, that means the typing is broken
      // @ts-expect-error Testing incorrect mapping
      expect(() => getFieldError('nonExistentControl')).toThrowError();

      expect(getFieldError('required')).toBe('This field is required.'); // Should use generic validator
    });
  });
});
