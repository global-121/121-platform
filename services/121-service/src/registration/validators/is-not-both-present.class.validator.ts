import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * IsNotBothPresent decorator.
 * Please provide a type when using IsNotBothEmpty decorator.
 * Example: @IsNotBothPresent<MyClass>('myOtherProperty')
 */

export function IsNotBothPresent<T extends object>(
  property: keyof T,
  validationOptions?: ValidationOptions,
) {
  return function (object: T, propertyName: keyof T) {
    registerDecorator({
      name: 'IsNotBothPresent',
      target: object.constructor,
      propertyName: propertyName.toString(),
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return !(value && relatedValue);
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `Only one of ${propertyName.toString()} or ${relatedPropertyName} can be present`;
        },
      },
    });
  };
}
