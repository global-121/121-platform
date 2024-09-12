import {
  registerDecorator,
  validate,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Equal, Repository } from 'typeorm';

import { AppDataSource } from '@121-service/src/appdatasource';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker.entity';
import { CreateRegistrationDto } from '@121-service/src/registration/dto/create-registration.dto';
import { Attributes } from '@121-service/src/registration/dto/update-registration.dto';
import {
  AnswerTypes,
  CustomAttributeType,
} from '@121-service/src/registration/enum/custom-data-attributes';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';

@ValidatorConstraint({ name: 'validateAttributeType', async: true })
export class RegistrationDataTypeClassValidator
  implements ValidatorConstraintInterface
{
  private message: string;

  public async validate(
    value: any,
    args: ValidationArguments,
  ): Promise<boolean> {
    const referenceId = args.object[args.constraints[0]['referenceId']];
    const attribute = args.object[args.constraints[0]['attribute']];
    const userId = args.object['userId'];

    if (referenceId === undefined || attribute === undefined) {
      this.message = 'ReferenceId or attribute are undefined';
      return false;
    }
    const registrationRepository =
      AppDataSource.getRepository(RegistrationEntity);
    const registration = await registrationRepository.findOne({
      where: { referenceId: Equal(referenceId) },
      relations: ['program'],
    });
    if (!registration) {
      this.message = `Registration was not found for referenceId: '${referenceId}'`;
      return false;
    }
    const validationInfo =
      await registration.program.getValidationInfoForQuestionName(attribute);
    if (!validationInfo.type) {
      this.message = `Attribute '${attribute}' was not found for the program related to the reference id:' ${referenceId}'`;
      return false;
    }
    if (attribute == Attributes.referenceId) {
      return this.referenceIdIsValid(
        value,
        registrationRepository,
        referenceId,
      );
    }
    const typeValid = this.typeIsValid(
      value,
      validationInfo.type,
      attribute,
      validationInfo.options,
    );
    if (!typeValid) {
      return false;
    }

    if (attribute == Attributes.scope) {
      return this.scopeIsValid(value, userId, registration.programId);
    }

    return true;
  }

  private createErrorMessageType(type, value, attribute): void {
    const valueString = Array.isArray(value) ? JSON.stringify(value) : value;
    this.message = `The value '${valueString}' given for the attribute '${attribute}' does not have the correct format for type '${type}'`;
  }

  public defaultMessage(_args: ValidationArguments): string {
    return this.message;
  }

  private async referenceIdIsValid(
    value: string,
    registrationRepository: Repository<RegistrationEntity>,
    orignalReferenceId: string,
  ): Promise<boolean> {
    const registration = await registrationRepository.findOne({
      where: { referenceId: Equal(value) },
      relations: ['program'],
    });
    if (registration && registration.referenceId !== orignalReferenceId) {
      this.message = `ReferenceId '${value}' already exists`;
      return false;
    } else {
      const dto = new CreateRegistrationDto();
      dto.referenceId = value;
      const valResult = await validate(dto);
      if (valResult.length > 0) {
        try {
          if (valResult[0].constraints) {
            this.message = Object.values(valResult[0].constraints).join(', ');
          }
        } catch (e) {
          this.message = JSON.stringify(valResult);
        }
        return false;
      }
    }
    return true;
  }

  private async scopeIsValid(
    value: string,
    userId: number,
    programId: number,
  ): Promise<boolean> {
    const assignmentRepo = AppDataSource.getRepository(
      ProgramAidworkerAssignmentEntity,
    );
    const assignment = await assignmentRepo.findOne({
      where: { userId: Equal(userId), programId: Equal(programId) },
    });
    const requestScope = assignment?.scope ? assignment.scope : '';
    const scopeValid =
      (requestScope && value.startsWith(requestScope)) || !requestScope;
    if (!scopeValid) {
      this.message = `'${value}' is not a valid scope. The valid scope for this account is '${requestScope}'`;
    }
    return scopeValid;
  }

  private typeIsValid(
    value: any,
    type: string,
    attribute: string,
    options?: any[],
  ): boolean | null {
    let isValid: boolean | null = false;
    if (type === AnswerTypes.date) {
      const datePattern =
        /^(0?[1-9]|[12][0-9]|3[01])-(0?[1-9]|1[0-2])-(19[2-9][0-9]|20[0-1][0-9])$/;
      isValid = datePattern.test(value);
    } else if (type === AnswerTypes.dropdown) {
      isValid = this.optionIsValid(value, options);
    } else if (type === AnswerTypes.multiSelect) {
      isValid = this.multiSelectIsValid(value, options);
    } else if (type === AnswerTypes.numeric) {
      isValid = !isNaN(+value);
    } else if (type === AnswerTypes.numericNullable) {
      isValid = !isNaN(+value) || null;
    } else if (type === AnswerTypes.tel) {
      // Potential refactor: put lookup code here
      isValid = this.phoneNumberIsValid(value);
    } else if (type === AnswerTypes.text || type === CustomAttributeType.text) {
      isValid = typeof value === 'string';
    } else if (type === CustomAttributeType.boolean) {
      isValid = typeof value == 'boolean' || this.valueIsBool(value);
    } else {
      this.message = `Type '${type}' is unknown'`;
      return false;
    }
    this.createErrorMessageType(type, value, attribute);
    return isValid;
  }

  private multiSelectIsValid(values: any, options?: any[]): boolean {
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

  private phoneNumberIsValid(value: any): boolean {
    if (value === '') {
      return true;
    } else if (!!value && value.length >= 8 && value.length <= 17) {
      return true;
    } else {
      return false;
    }
  }

  private optionIsValid(value: any, options?: any[]): boolean {
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
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [validationAttributes],
      validator: RegistrationDataTypeClassValidator,
    });
  };
}
