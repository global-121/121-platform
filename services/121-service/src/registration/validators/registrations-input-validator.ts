import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import {
  BulkImportDto,
  ImportRegistrationsDto,
} from '@121-service/src/registration/dto/bulk-import.dto';
import { BulkUpdateDto } from '@121-service/src/registration/dto/bulk-update.dto';
import { AdditionalAttributes } from '@121-service/src/registration/dto/update-registration.dto';
import { ValidationConfigDto } from '@121-service/src/registration/dto/validate-registration-config.dto';
import { ValidateRegistrationErrorObjectDto } from '@121-service/src/registration/dto/validate-registration-error-object.dto';
import {
  AnswerTypes,
  Attribute,
  AttributeWithOptionalLabel,
  CustomAttributeType,
  GenericAttributes,
  QuestionType,
} from '@121-service/src/registration/enum/custom-data-attributes';
import { RegistrationCsvValidationEnum } from '@121-service/src/registration/enum/registration-csv-validation.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationsInputValidatorHelpers } from '@121-service/src/registration/validators/registrations-input.validator.helper';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { UserService } from '@121-service/src/user/user.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';

@Injectable()
export class RegistrationsInputValidator {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  constructor(
    private readonly userService: UserService,
    private readonly lookupService: LookupService,
  ) {}

  public async validateAndCleanRegistrationsInput(
    csvArray: any[],
    programId: number,
    userId: number,
    dynamicAttributes: AttributeWithOptionalLabel[],
    typeOfInput: RegistrationCsvValidationEnum,
    validationConfig: ValidationConfigDto = new ValidationConfigDto(),
  ): Promise<ImportRegistrationsDto[] | BulkImportDto[]> {
    const errors: ValidateRegistrationErrorObjectDto[] = [];
    const phoneNumberLookupResults: Record<string, string | undefined> = {};

    const userScope = await this.userService.getUserScopeForProgram(
      userId,
      programId,
    );

    if (validationConfig.validateUniqueReferenceId) {
      this.validateUniqueReferenceIds(csvArray);
    }

    const program = await this.programRepository.findOneByOrFail({
      id: programId,
    });

    const languageMapping = this.createLanguageMapping(
      program.languages as unknown as string[],
    );

    const validatedArray: any = [];
    const importRecordMap = {
      [RegistrationCsvValidationEnum.importAsRegistered]:
        ImportRegistrationsDto,
      [RegistrationCsvValidationEnum.bulkUpdate]: BulkUpdateDto,
    };

    for (const [i, row] of csvArray.entries()) {
      const importRecordClass = importRecordMap[typeOfInput];
      const importRecord = importRecordClass
        ? new importRecordClass()
        : ({} as any);

      /*
       * =============================================================
       * Add default registration attributes without custom validation
       * =============================================================
       */
      importRecord.fspName = row.fspName;
      if (!program.paymentAmountMultiplierFormula) {
        importRecord.paymentAmountMultiplier = row.paymentAmountMultiplier
          ? +row.paymentAmountMultiplier
          : null;
      }

      if (program.enableMaxPayments) {
        importRecord.maxPayments = row.maxPayments ? +row.maxPayments : null;
      }

      /*
       * ========================================
       * Validate default registration attributes
       * ========================================
       */
      const errorObjScope = this.validateRowScope(
        row,
        userScope,
        i,
        validationConfig,
      );
      if (errorObjScope) {
        errors.push(errorObjScope);
      }

      if (program.enableScope) {
        importRecord.scope = row[AdditionalAttributes.scope];
      }
      importRecord.referenceId = row.referenceId;

      const { errorObj: errorObjLanguage, preferredLanguage: _ } =
        this.validatePreferredLanguage(
          row.preferredLanguage,
          languageMapping,
          i,
          validationConfig,
        );
      if (errorObjLanguage) {
        errors.push(errorObjLanguage);
      }
      importRecord.preferredLanguage = this.updateLanguage(
        row.preferredLanguage,
        languageMapping,
      );

      const errorObjReferenceId = await this.validateReferenceId(
        row,
        i,
        validationConfig,
      );
      if (errorObjReferenceId) {
        errors.push(errorObjReferenceId);
      }
      importRecord.referenceId = row.referenceId;

      const errorObj = this.validatePhoneNumberEmpty(row, i, validationConfig);
      if (errorObj) {
        errors.push(errorObj);
      } else {
        importRecord.phoneNumber = row.phoneNumber ? row.phoneNumber : ''; // If the phone number is empty use an empty string
      }

      /*
       * =============================================
       * Validate dynamic registration data attributes
       * =============================================
       */

      // Filter dynamic atttributes that are not relevant for this fsp if question is only fsp specific
      const dynamicAttributesForFsp = dynamicAttributes.filter((att) =>
        this.isDynamicAttributeForFsp(att, row.fspName),
      );

      await Promise.all(
        dynamicAttributesForFsp.map(async (att) => {
          if (att.type === AnswerTypes.tel) {
            /*
             * ==================================================================
             * If an attribute is a phone number, validate it using Twilio lookup
             * ==================================================================
             */

            if (row[att.name] && validationConfig.validatePhoneNumberLookup) {
              const { errorObj, sanitized } =
                await this.validateLookupPhoneNumber(
                  row[att.name],
                  i,
                  phoneNumberLookupResults,
                );
              if (errorObj) {
                errors.push(errorObj);
              } else {
                phoneNumberLookupResults[row[att.name]] = sanitized;
                importRecord[att.name] = sanitized;
              }
            } else {
              importRecord[att.name] = row[att.name] ? row[att.name] : ''; // If the phone number is empty use an empty string
            }
            return;
          }

          if (att.type === AnswerTypes.dropdown) {
            const optionNames = att.options
              ? att.options?.map((option) => option.option)
              : [];
            if (!optionNames.includes(row[att.name])) {
              const optionNamesErrorString = optionNames.length
                ? optionNames.join(', ')
                : 'No options available';
              const errorObj = {
                lineNumber: i + 1,
                column: att.name,
                value: row[att.name],
                error: `Value '${row[att.name]}' is not in the allowed options: '${optionNamesErrorString}' for attribute '${att.name}'`,
              };
              errors.push(errorObj);
            } else {
              importRecord[att.name] = row[att.name];
            }
            return;
          }

          /*
           * ============================================================
           * If an attribute is anything else, validate it as such
           * ============================================================
           */
          const errorObj = this.validateNonTelephoneDynamicAttribute(
            row[att.name],
            att.type,
            att.name,
            i,
          );
          if (errorObj && Object.keys(row).includes(att.name)) {
            errors.push(errorObj);
          } else {
            importRecord[att.name] = row[att.name];
          }
        }),
      );

      // Break the loop and stop processing if file has too many errors
      if (errors.length >= 5000) {
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }

      if (validationConfig.validateClassValidator) {
        const result = await validate(importRecord);
        if (result.length > 0) {
          let error = result[0].toString();
          if (result[0]?.constraints) {
            error = Object.values(result[0].constraints).join(', ');
          }

          const errorObj = {
            lineNumber: i + 1,
            column: result[0].property,
            value: result[0].value,
            error,
          };
          errors.push(errorObj);
        }
      }
      validatedArray.push(importRecord);
    }

    // Throw the errors at once
    if (errors.length > 0) {
      throw new HttpException(errors, HttpStatus.BAD_REQUEST);
    }

    return validatedArray;
  }

  private validateUniqueReferenceIds(csvArray: any[]): void {
    const allReferenceIds = csvArray
      .filter((row) => row.referenceId)
      .map((row) => row.referenceId);
    const uniqueReferenceIds = [...new Set(allReferenceIds)];
    if (uniqueReferenceIds.length < allReferenceIds.length) {
      throw new HttpException(
        'Duplicate referenceIds in import set',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private createLanguageMapping(programLanguages: string[]): object {
    const languageNamesApi = new Intl.DisplayNames(['en'], {
      type: 'language',
    });
    const mapping = {};
    for (const languageAbbr of programLanguages) {
      const fullNameLanguage = languageNamesApi.of(
        languageAbbr.substring(0, 2),
      );
      if (!fullNameLanguage) {
        throw new HttpException(
          `Language ${languageAbbr} not found in createLanguageMapping`,
          HttpStatus.BAD_REQUEST,
        );
      }
      const cleanedFullNameLanguage = fullNameLanguage.trim().toLowerCase();
      mapping[cleanedFullNameLanguage] = languageAbbr;
    }
    return mapping;
  }

  private validatePreferredLanguage(
    preferredLanguage: string,
    languageMapping: any,
    i: number,
    validationConfig: ValidationConfigDto = new ValidationConfigDto(),
  ): {
    errorObj?: ValidateRegistrationErrorObjectDto;
    preferredLanguage?: LanguageEnum;
  } {
    if (validationConfig.validatePreferredLanguage) {
      const cleanedPreferredLanguage =
        typeof preferredLanguage === 'string'
          ? preferredLanguage.trim().toLowerCase()
          : preferredLanguage;

      const errorObj = this.checkLanguage(
        cleanedPreferredLanguage,
        languageMapping,
        i,
      );

      if (errorObj) {
        return { errorObj, preferredLanguage: undefined };
      } else {
        const value = this.updateLanguage(
          cleanedPreferredLanguage,
          languageMapping,
        );
        return { errorObj: undefined, preferredLanguage: value };
      }
    }
    return {
      errorObj: undefined,
      preferredLanguage: preferredLanguage as LanguageEnum,
    };
  }

  private checkLanguage(
    inPreferredLanguage: string,
    programLanguageMapping: object,
    i: number,
  ): ValidateRegistrationErrorObjectDto | undefined {
    const cleanedPreferredLanguage =
      typeof inPreferredLanguage === 'string'
        ? inPreferredLanguage.trim().toLowerCase()
        : inPreferredLanguage;
    if (!cleanedPreferredLanguage) {
      return;
    } else if (
      !Object.keys(programLanguageMapping).includes(cleanedPreferredLanguage) &&
      !Object.values(programLanguageMapping).some(
        (x) => x.toLowerCase() == cleanedPreferredLanguage.toLowerCase(),
      )
    ) {
      return {
        lineNumber: i + 1,
        column: AdditionalAttributes.preferredLanguage,
        value: inPreferredLanguage,
        error: `Language error: Allowed values of this program for preferredLanguage: ${Object.values(
          programLanguageMapping,
        ).join(', ')}, ${Object.keys(programLanguageMapping).join(', ')}`,
      };
    }
  }

  private updateLanguage(
    inPreferredLanguage: string,
    programLanguageMapping: object,
  ): LanguageEnum | undefined {
    const cleanedPreferredLanguage =
      typeof inPreferredLanguage === 'string'
        ? inPreferredLanguage.trim().toLowerCase()
        : inPreferredLanguage;
    if (!cleanedPreferredLanguage) {
      return LanguageEnum.en;
    } else if (
      Object.keys(programLanguageMapping).includes(cleanedPreferredLanguage)
    ) {
      return programLanguageMapping[cleanedPreferredLanguage];
    } else if (
      Object.values(programLanguageMapping).some(
        (x) => x.toLowerCase() == cleanedPreferredLanguage.toLowerCase(),
      )
    ) {
      for (const value of Object.values(programLanguageMapping)) {
        if (value.toLowerCase() === cleanedPreferredLanguage) {
          return value;
        }
      }
    }
  }

  private validateRowScope(
    row: any,
    userScope: string,
    i: number,
    validationConfig: ValidationConfigDto,
  ): ValidateRegistrationErrorObjectDto | undefined {
    if (validationConfig.validateScope) {
      const correctScope = this.recordHasAllowedScope(row, userScope);
      if (!correctScope) {
        return {
          lineNumber: i + 1,
          column: AdditionalAttributes.scope,
          value: row[AdditionalAttributes.scope],
          error: `User has program scope ${userScope} and does not have access to registration scope ${
            row[AdditionalAttributes.scope]
          }`,
        };
      }
    }
  }

  private recordHasAllowedScope(record: any, userScope: string): boolean {
    return (
      (userScope &&
        record[AdditionalAttributes.scope]?.startsWith(userScope)) ||
      !userScope
    );
  }

  private async validateReferenceId(
    row: any,
    i: number,
    validationConfig: ValidationConfigDto,
  ): Promise<ValidateRegistrationErrorObjectDto | undefined> {
    if (validationConfig.validateExistingReferenceId && row.referenceId) {
      const registration = await this.registrationRepository.findOne({
        where: { referenceId: row.referenceId },
      });
      if (registration) {
        return {
          lineNumber: i + 1,
          column: GenericAttributes.referenceId,
          value: row.referenceId,
          error: 'referenceId already exists in database',
        };
      }
    }
  }

  private validatePhoneNumberEmpty(
    row: any,
    i: number,
    validationConfig: ValidationConfigDto,
  ): ValidateRegistrationErrorObjectDto | undefined {
    if (!row.phoneNumber && validationConfig.validatePhoneNumberEmpty) {
      return {
        lineNumber: i + 1,
        column: GenericAttributes.phoneNumber,
        value: row.phoneNumber,
        error: 'PhoneNumber is not allowed to be empty',
      };
    }
  }

  private isDynamicAttributeForFsp(
    attribute: Attribute | AttributeWithOptionalLabel,
    fspName: FinancialServiceProviderName,
  ): boolean {
    // If the CSV does not have fspName all attributes may be relevant because a bulk PATCH may be for multiple FSPs
    if (!fspName) {
      return true;
    }
    if (
      attribute.questionTypes &&
      (attribute.questionTypes.length > 1 ||
        attribute.questionTypes[0] !== QuestionType.fspQuestion)
    ) {
      // The attribute has multiple question types or is not FSP-specific
      return true;
    }

    if (
      attribute.questionTypes &&
      attribute.questionTypes.length === 1 &&
      attribute.questionTypes[0] === QuestionType.fspQuestion &&
      attribute.fspNames?.includes(fspName)
    ) {
      // The attribute has a single question type that is FSP-specific and is relevant for the FSP of this registration
      return true;
    }

    // The attribute is not relevant
    return false;
  }

  private async validateLookupPhoneNumber(
    value: string,
    i: number,
    phoneNumberLookupResults: Record<string, string | undefined>,
  ): Promise<{
    errorObj?: ValidateRegistrationErrorObjectDto;
    sanitized?: string;
  }> {
    let sanitized: string | undefined;
    if (phoneNumberLookupResults[value]) {
      sanitized = phoneNumberLookupResults[value];
    } else {
      sanitized = await this.lookupService.lookupAndCorrect(value, true);
    }
    if (!sanitized && !!value) {
      const errorObj = {
        lineNumber: i + 1,
        column: 'phoneNumber',
        value: value,
        error: 'PhoneNumber is not valid according to Twilio lookup',
      };
      return { errorObj, sanitized };
    }
    return { errorObj: undefined, sanitized };
  }

  private validateNonTelephoneDynamicAttribute(
    value: string,
    type: string,
    columnName: string,
    i: number,
  ): ValidateRegistrationErrorObjectDto | undefined {
    const cleanedValue = this.cleanNonTelephoneDynamicAttribute(value, type);
    if (cleanedValue === null) {
      const errorObj = {
        lineNumber: i + 1,
        column: columnName,
        value: value,
        error: `Value is not a valid ${type}`,
      };
      return errorObj;
    }
  }

  private cleanNonTelephoneDynamicAttribute(
    value: string,
    type: string,
  ): number | boolean | string | null {
    switch (type) {
      case AnswerTypes.numeric:
        if (value == null) {
          return null;
        }
        // Convert the value to a number and return it
        // If the value is not a number, return null
        return isNaN(Number(value)) ? null : Number(value);
      case CustomAttributeType.boolean:
        // Convert the value to a boolean and return it
        // If the value is not a boolean, return null
        const convertedValue =
          RegistrationsInputValidatorHelpers.stringToBoolean(value);
        return convertedValue === undefined ? null : convertedValue;
      default:
        // If the type is neither numeric nor boolean, return the original value
        return value;
    }
  }
}
