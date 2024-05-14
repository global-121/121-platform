import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * IsNotBothEmpty decorator.
 * Please provide a type when using IsNotBothEmpty decorator.
 * Example: @IsNotBothEmpty<MyClass>('myOtherProperty')
 */
export function IsNotBothEmpty<T extends object>(
  property: keyof T,
  validationOptions?: ValidationOptions,
) {
  return function (object: T, propertyName: keyof T) {
    registerDecorator({
      name: 'IsNotBothEmpty',
      target: object.constructor,
      propertyName: propertyName.toString(),
      constraints: [property.toString()],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return !(!value && !relatedValue);
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${propertyName.toString()} and ${relatedPropertyName} cannot both be empty`;
        },
      },
    });
  };
}
