import { RegistrationEntity } from '../registration.entity';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { getConnection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AnswerTypes,
  CustomAttributeType,
} from '../enum/custom-data-attributes';

@ValidatorConstraint({ name: 'validateAttributeType', async: true })
export class RegistrationDataTypeValidator
  implements ValidatorConstraintInterface {
  private message: string;

  public constructor() {}

  public async validate(
    value: any,
    args: ValidationArguments,
  ): Promise<boolean> {
    const referenceId = args.object[args.constraints[0]['referenceId']];
    const attribute = args.object[args.constraints[0]['attribute']];

    if (referenceId === undefined || attribute === undefined) {
      this.message = 'ReferenceId or attribute are undefined';
      return false;
    }
    const registrationRepository = getConnection().getRepository(
      RegistrationEntity,
    );
    const registration = await registrationRepository.findOne({
      where: { referenceId: referenceId },
      relations: ['program'],
    });
    if (!registration) {
      this.message = `Registration was not found for referenceId: '${referenceId}'`;
      return false;
    }
    const validationInfo = await registration.program.getValidationInfoForQuestionName(
      attribute,
    );
    if (!validationInfo.type) {
      this.message = `Attribute '${attribute}' was not found for the program related to the reference id:' ${referenceId}'`;
      return false;
    }
    return this.typeIsValid(
      value,
      validationInfo.type,
      validationInfo.options,
      attribute,
    );
  }

  private createErrorMessageType(type, value, attribute): void {
    const valueString = Array.isArray(value) ? JSON.stringify(value) : value;
    this.message = `The value '${valueString} given for the attribute '${attribute}' does not have the corect type: '${type}'`;
  }

  public defaultMessage(args: ValidationArguments): string {
    return this.message;
  }

  private typeIsValid(
    value: any,
    type: string,
    options: any[],
    attribute: string,
  ): boolean {
    let isValid = false;
    if (type === AnswerTypes.date) {
      const parsedDate = Date.parse(value);
      isValid = !!parsedDate;
    } else if (type === AnswerTypes.dropdown) {
      isValid = this.optionIsValid(value, options);
    } else if (type === AnswerTypes.multiSelect) {
      isValid = this.multiSelectIsValid(value, options);
    } else if (type === AnswerTypes.numeric) {
      isValid = !isNaN(+value);
    } else if (type === AnswerTypes.tel) {
      // Potential refactor: put lookup code here
      isValid = !!value.length && value.length >= 8 && value.length <= 17;
    } else if (type === AnswerTypes.text || type === CustomAttributeType.text) {
      isValid = typeof value === 'string';
    } else if (type === CustomAttributeType.boolean) {
      isValid = typeof value == 'boolean' || this.valueIsBool(value);
    } else {
      this.message = `Type '${type}' is unkown'`;
      return false;
    }
    this.createErrorMessageType(type, value, attribute);
    return isValid;
  }

  private multiSelectIsValid(values: any, options: any[]): boolean {
    if (!Array.isArray(values) || values.length === 0) {
      return false;
    }
    if (!(values.length === new Set(values).size)) {
      return false;
    }
    for (const value of values) {
      if (!this.optionIsValid(value, options)) {
        return false;
      }
    }
    return true;
  }

  private optionIsValid(value: any, options: any[]): boolean {
    if (!options) {
      return false;
    } else {
      for (const option of options) {
        if (option.option === value) {
          return true;
        }
      }
      return false;
    }
  }

  private valueIsBool(value): boolean {
    const allowedValues = ['true', 'yes', '1', 'false', '0', 'no', null];
    return allowedValues.includes(value);
  }
}

class ValidateRegistrationDataAttributessDto {
  public referenceId: string;
  public attribute: string;
}

export function IsRegistrationDataValidType(
  validationAttributes: ValidateRegistrationDataAttributessDto,
  validationOptions?: ValidationOptions,
): any {
  return function(object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [validationAttributes],
      validator: RegistrationDataTypeValidator,
    });
  };
}
