import { ValidateIf, type ValidationOptions } from 'class-validator';

/** Same as `@Optional()` decorator of class-validator, but adds a conditional layer on top of it */
// Solution was inspired by https://stackoverflow.com/a/78799453
export const IsOptionalIf: IsOptionalIf =
  (condition, validationOptions?: ValidationOptions) =>
  (target: object, propertyKey: string | symbol) => {
    ValidateIf((object: Record<string, unknown>, value: unknown): boolean => {
      // if condition was true, just disable the validation on the null & undefined fields
      const isOptional = Boolean(condition(object, value));
      const isNull = object[propertyKey] === null;
      const isUndefined = object[propertyKey] === undefined;
      const isDefined = !(isNull || isUndefined);

      const isRequired = isOptional && !isDefined ? false : true;
      return isRequired;
    }, validationOptions)(target, propertyKey);
  };

export type IsOptionalIf = <
  T extends Record<string, unknown> = Record<string, unknown>, // class instance
  Y extends keyof T = keyof T, // propertyName
>(
  condition: (object: T, value: T[Y]) => boolean,
  validationOptions?: ValidationOptions,
) => PropertyDecorator;
