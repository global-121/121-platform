import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validate } from 'class-validator';
import { Equal, Repository } from 'typeorm';

import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { AdditionalAttributes } from '@121-service/src/registration/dto/update-registration.dto';
import {
  GenericRegistrationAttributes,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationValidationInputType } from '@121-service/src/registration/enum/registration-validation-input-type.enum';
import { ValidationRegistrationConfig } from '@121-service/src/registration/interfaces/validate-registration-config.interface';
import { ValidateRegistrationErrorObject } from '@121-service/src/registration/interfaces/validate-registration-error-object.interface';
import { ValidatedRegistrationInput } from '@121-service/src/registration/interfaces/validated-registration-input.interface';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { UserService } from '@121-service/src/user/user.service';

type InputAttributeType = string | boolean | number | undefined | null;

@Injectable()
export class RegistrationsInputValidator {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  constructor(
    private readonly userService: UserService,
    private readonly lookupService: LookupService,
    private readonly registrationPaginationService: RegistrationsPaginationService,
  ) {}

  public async validateAndCleanInput({
    registrationInputArray,
    programId,
    userId,
    typeOfInput,
    validationConfig,
  }: {
    registrationInputArray: Record<string, InputAttributeType>[];
    programId: number;
    userId: number;
    typeOfInput: RegistrationValidationInputType;
    validationConfig: ValidationRegistrationConfig;
  }): Promise<ValidatedRegistrationInput[]> {
    // empty map
    let originalRegistrationsMap = new Map<
      string,
      MappedPaginatedRegistrationDto
    >();
    if (
      [
        RegistrationValidationInputType.update,
        RegistrationValidationInputType.bulkUpdate,
      ].includes(typeOfInput)
    ) {
      originalRegistrationsMap = await this.getOriginalRegistrationsOrThrow(
        registrationInputArray,
        programId,
      );
    }

    const errors: ValidateRegistrationErrorObject[] = [];
    const phoneNumberLookupResults: Record<string, string | undefined> = {};

    const userScope = await this.userService.getUserScopeForProgram(
      userId,
      programId,
    );

    if (validationConfig.validateUniqueReferenceId) {
      this.validateUniqueReferenceIds(registrationInputArray);
    }

    const program = await this.programRepository.findOneOrFail({
      where: { id: Equal(programId) },
      relations: ['programFspConfigurations', 'programRegistrationAttributes'],
    });

    const languageMapping = this.createLanguageMapping(
      program.languages as unknown as string[],
    );

    const validatedArray: ValidatedRegistrationInput[] = [];

    for (const [i, row] of registrationInputArray.entries()) {
      const originalRegistration = [
        RegistrationValidationInputType.update,
        RegistrationValidationInputType.bulkUpdate,
      ].includes(typeOfInput)
        ? originalRegistrationsMap.get(row.referenceId as string)
        : undefined;

      const validatedRegistrationInput: ValidatedRegistrationInput = {
        data: {},
      };

      /*
       * =============================================================
       * Add default registration attributes without custom validation
       * =============================================================
       */
      if (row[AdditionalAttributes.paymentAmountMultiplier] !== undefined) {
        const {
          errorOjb: errorObjPaymentAmountMultiplier,
          validatedPaymentAmountMultiplier,
        } = this.validatePaymentAmountMultiplier({
          value: row.paymentAmountMultiplier,
          programPaymentAmountMultiplierFormula:
            program.paymentAmountMultiplierFormula,
          i,
        });
        if (errorObjPaymentAmountMultiplier) {
          errors.push(errorObjPaymentAmountMultiplier);
        } else {
          validatedRegistrationInput.paymentAmountMultiplier =
            validatedPaymentAmountMultiplier;
        }
      }

      if (program.enableMaxPayments && row.maxPayments !== undefined) {
        const { errorObj: errorObjMaxPayments, validatedMaxPayments } =
          this.validateMaxPayments({
            value: row.maxPayments,
            originalRegistration,
            i,
          });
        if (errorObjMaxPayments) {
          errors.push(errorObjMaxPayments);
        } else {
          validatedRegistrationInput.maxPayments = validatedMaxPayments;
        }
      }

      /*
       * ========================================
       * Validate default registration properties
       * ========================================
       */
      if (row[AdditionalAttributes.scope] !== undefined) {
        const errorObjScope = this.validateRowScope({
          row,
          userScope,
          i,
          typeOfInput,
        });
        if (errorObjScope) {
          errors.push(errorObjScope);
        } else if (program.enableScope) {
          // We know that scope is undefined or string, or an error would have occured
          validatedRegistrationInput.scope = row[AdditionalAttributes.scope] as
            | undefined
            | string;
        }
      }

      const {
        errorObj: errorObjLanguage,
        preferredLanguage: preferredLanguage,
      } = this.validatePreferredLanguage({
        preferredLanguage: row.preferredLanguage,
        languageMapping,
        i,
        typeOfInput,
      });
      if (errorObjLanguage) {
        errors.push(errorObjLanguage);
      }
      if (preferredLanguage) {
        validatedRegistrationInput.preferredLanguage = preferredLanguage;
      }

      const errorObjReferenceId = await this.validateReferenceId({
        row,
        i,
        validationConfig,
      });
      if (errorObjReferenceId) {
        errors.push(errorObjReferenceId);
      } else if (row.referenceId != null) {
        validatedRegistrationInput.referenceId = row.referenceId as string;
      }

      const errorObjValidatePhoneNr = this.validatePhoneNumberEmpty({
        row,
        i,
        program,
        typeOfInput,
      });
      if (errorObjValidatePhoneNr) {
        errors.push(errorObjValidatePhoneNr);
      } else if (row.phoneNumber !== undefined) {
        validatedRegistrationInput.phoneNumber = row.phoneNumber
          ? String(row.phoneNumber)
          : null;
      }

      /*
       * =============================================
       * Validate fsp config related attributes
       * =============================================
       */
      const errorObjFspConfig = this.validateProgramFspConfigurationName({
        programFspConfigurationName:
          row[AdditionalAttributes.programFspConfigurationName],
        programFspConfigurations: program.programFspConfigurations,
        i,
        typeOfInput,
      });
      if (errorObjFspConfig) {
        errors.push(errorObjFspConfig);
      } else if (
        row[AdditionalAttributes.programFspConfigurationName] as string
      ) {
        validatedRegistrationInput[
          AdditionalAttributes.programFspConfigurationName
        ] = row[AdditionalAttributes.programFspConfigurationName] as string;
      }

      const errorObjsFspRequiredAttributes = this.validateFspRequiredAttributes(
        {
          row,
          originalRegistration,
          programFspConfigurations: program.programFspConfigurations,
          i,
        },
      );
      errors.push(...errorObjsFspRequiredAttributes);

      /*
       * =============================================
       * Validate dynamic registration data attributes
       * =============================================
       */

      // Filter dynamic atttributes that are not relevant for this fsp if question is only fsp specific

      await Promise.all(
        program.programRegistrationAttributes.map(async (att) => {
          // Skip validation if the attribute is not present in the row and it is a bulk update because you do not have to update all attributes in a bulk update
          if (
            [
              RegistrationValidationInputType.update,
              RegistrationValidationInputType.bulkUpdate,
            ].includes(typeOfInput) &&
            row[att.name] === undefined
          ) {
            return;
          }

          // If attribute is not required skip in case of undefined and on null add to validatedRegistrationInput so it will be removed later on
          if (!att.isRequired) {
            if (row[att.name] === undefined) {
              return;
            }
            if (row[att.name] == null || row[att.name] === '') {
              validatedRegistrationInput.data[att.name] = null;
              return;
            }
          }

          if (att.type === RegistrationAttributeTypes.tel) {
            if (RegistrationValidationInputType.bulkUpdate === typeOfInput) {
              errors.push({
                lineNumber: i + 1,
                column: att.name,
                value: row[att.name],
                error: `Attribute ${att.name} is of type tel (telephone number) and cannot be updated in bulk`,
              });
            }
            /*
             * ==================================================================
             * If an attribute is a phone number, validate it using Twilio lookup
             * ==================================================================
             */

            if (row[att.name] && validationConfig) {
              const { errorObj, sanitized } =
                await this.validateLookupPhoneNumber({
                  value: row[att.name],
                  i,
                  phoneNumberLookupResults,
                });
              if (errorObj) {
                errors.push(errorObj);
              } else if (row[att.name]) {
                // we can assume here that the orginal value is a string else it would not have returned an error object
                phoneNumberLookupResults[row[att.name] as string] = sanitized;
                validatedRegistrationInput.data[att.name] = sanitized as string;
              }
            } else {
              validatedRegistrationInput.data[att.name] = row[att.name]
                ? (row[att.name] as string)
                : null;
            }
            return;
          }

          if (att.type === RegistrationAttributeTypes.dropdown) {
            const optionNames = att.options
              ? att.options?.map((option) => option.option)
              : [];

            if (optionNames.includes(String(row[att.name]))) {
              // Validation passed
              validatedRegistrationInput.data[att.name] = row[
                att.name
              ] as string;
              return;
            }

            // validation error
            const optionNamesErrorString =
              optionNames.length > 0
                ? optionNames.join(', ')
                : 'No options available';
            const errorObj = {
              lineNumber: i + 1,
              column: att.name,
              value: row[att.name],
              error: `Value '${row[att.name]}' is not in the allowed options: '${optionNamesErrorString}' for attribute '${att.name}'`,
            };
            errors.push(errorObj);

            return;
          }

          /*
           * ============================================================
           * If an attribute is anything else, validate it as such
           * ============================================================
           */
          if (att.isRequired === false && row[att.name] == null) {
            validatedRegistrationInput.data[att.name] = null;
            return;
          }
          const errorObj = this.validateTypesNumericBoolTextDate({
            value: row[att.name],
            type: att.type,
            attribute: att.name,
            i,
          });
          if (errorObj && Object.keys(row).includes(att.name)) {
            errors.push(errorObj);
          } else if (row[att.name] !== undefined) {
            validatedRegistrationInput.data[att.name] = row[att.name] as
              | string
              | number
              | boolean;
          }
        }),
      );

      // Break the loop and stop processing if file has too many errors
      if (errors.length >= 5000) {
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }

      const result = await validate(validatedRegistrationInput);
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

      validatedArray.push(validatedRegistrationInput);
    }

    // Throw the errors at once
    if (errors.length > 0) {
      throw new HttpException(errors, HttpStatus.BAD_REQUEST);
    }

    return validatedArray;
  }

  private validateUniqueReferenceIds(
    csvArray: Record<string, InputAttributeType>[],
  ): void {
    const allReferenceIds = csvArray
      .filter((row) => row[AdditionalAttributes.referenceId])
      .map((row) => row[AdditionalAttributes.referenceId]);
    const uniqueReferenceIds = [...new Set(allReferenceIds)];
    if (uniqueReferenceIds.length < allReferenceIds.length) {
      throw new HttpException(
        'Duplicate referenceIds in import set',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private createLanguageMapping(
    programLanguages: string[],
  ): Record<string, string> {
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

  private validateProgramFspConfigurationName({
    programFspConfigurationName: programFspName,
    programFspConfigurations: programFspConfigurations,
    i,
    typeOfInput,
  }: {
    programFspConfigurationName: InputAttributeType;
    programFspConfigurations: ProgramFspConfigurationEntity[];
    i: number;
    typeOfInput: RegistrationValidationInputType;
  }): ValidateRegistrationErrorObject | undefined {
    // The registration is being patched, and the programFspConfigurationName is not being updated so the validation can be skipped
    if (
      [
        RegistrationValidationInputType.update,
        RegistrationValidationInputType.bulkUpdate,
      ].includes(typeOfInput) &&
      (programFspName == null || programFspName === '')
    ) {
      return;
    }

    if (
      !programFspName ||
      !programFspConfigurations.some(
        (fspConfig) => fspConfig.name === programFspName,
      )
    ) {
      return {
        lineNumber: i,
        value: programFspName,
        column: AdditionalAttributes.programFspConfigurationName,
        error: `FspConfigurationName ${programFspName} not found in program. Allowed values: ${programFspConfigurations
          .map((fspConfig) => fspConfig.name)
          .join(', ')}`,
      };
    }
  }

  private validatePreferredLanguage({
    preferredLanguage,
    languageMapping,
    i,
    typeOfInput,
  }: {
    preferredLanguage: InputAttributeType;
    languageMapping: Record<string, string>;
    i: number;
    typeOfInput: RegistrationValidationInputType;
  }): {
    errorObj: ValidateRegistrationErrorObject | undefined;
    preferredLanguage: LanguageEnum | undefined;
  } {
    const errorObj = this.checkLanguage({
      preferredLanguage,
      languageMapping,
      i,
      typeOfInput,
    });

    const cleanedPreferredLanguage =
      typeof preferredLanguage === 'string'
        ? preferredLanguage.trim().toLowerCase()
        : String(preferredLanguage);
    if (errorObj) {
      return { errorObj, preferredLanguage: undefined };
    }
    const value = this.updateLanguage(
      cleanedPreferredLanguage,
      languageMapping,
    );
    return { errorObj: undefined, preferredLanguage: value };
  }

  private checkLanguage({
    preferredLanguage,
    languageMapping,
    i,
    typeOfInput,
  }: {
    preferredLanguage: InputAttributeType;
    languageMapping: object;
    i: number;
    typeOfInput: RegistrationValidationInputType;
  }): ValidateRegistrationErrorObject | undefined {
    if (
      [
        RegistrationValidationInputType.update,
        RegistrationValidationInputType.bulkUpdate,
      ].includes(typeOfInput) &&
      !preferredLanguage === undefined
    ) {
      return;
    }
    if (!preferredLanguage) {
      return;
    } else if (
      !Object.keys(languageMapping).includes(preferredLanguage.toString()) &&
      !Object.values(languageMapping).some(
        (x) => x.toLowerCase() == preferredLanguage.toString().toLowerCase(),
      )
    ) {
      return {
        lineNumber: i + 1,
        column: AdditionalAttributes.preferredLanguage,
        value: preferredLanguage,
        error: `Language error: Allowed values of this program for ${AdditionalAttributes.preferredLanguage}: ${Object.values(
          languageMapping,
        ).join(', ')}, ${Object.keys(languageMapping).join(', ')}`,
      };
    }
  }

  private updateLanguage(
    preferredLanguage: string | undefined,
    programLanguageMapping: object,
  ): LanguageEnum | undefined {
    if (!preferredLanguage) {
      return LanguageEnum.en;
    }
    if (Object.keys(programLanguageMapping).includes(preferredLanguage)) {
      return programLanguageMapping[preferredLanguage];
    } else if (
      Object.values(programLanguageMapping).some(
        (x) => x.toLowerCase() == preferredLanguage.toLowerCase(),
      )
    ) {
      for (const value of Object.values(programLanguageMapping)) {
        if (value.toLowerCase() === preferredLanguage) {
          return value;
        }
      }
    }
  }

  private validateRowScope({
    row,
    userScope,
    i,
    typeOfInput,
  }: {
    row: Record<string, InputAttributeType>;
    userScope: string;
    i: number;
    typeOfInput: RegistrationValidationInputType;
  }): ValidateRegistrationErrorObject | undefined {
    const correctScope = this.rowHasAllowedScope({
      row,
      userScope,
      typeOfInput,
    });
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

  private rowHasAllowedScope({
    row,
    userScope,
    typeOfInput,
  }: {
    row: Record<string, InputAttributeType>;
    userScope: string;
    typeOfInput: RegistrationValidationInputType;
  }): boolean {
    const scopeOfInput = row[AdditionalAttributes.scope];

    // Other types than string or null/undefined are not allowed
    if (typeof scopeOfInput !== 'string' && scopeOfInput != null) {
      return false;
    }

    // All scopes allowed for this user
    if (userScope === '') {
      return true;
    }

    // If scopeOfInput is null, return true for bulkUpdate, false otherwise
    if (scopeOfInput == null) {
      return [
        RegistrationValidationInputType.update,
        RegistrationValidationInputType.bulkUpdate,
      ].includes(typeOfInput);
    }

    // Check if scopeOfInput starts with userScope
    return scopeOfInput.startsWith(userScope);
  }

  private async validateReferenceId({
    row,
    i,
    validationConfig,
  }: {
    row: Record<string, InputAttributeType>;
    i: number;
    validationConfig: ValidationRegistrationConfig;
  }): Promise<ValidateRegistrationErrorObject | undefined> {
    if (!row.referenceId) {
      return;
    }
    if (typeof row.referenceId !== 'string') {
      return {
        lineNumber: i + 1,
        column: GenericRegistrationAttributes.referenceId,
        value: row.referenceId,
        error: 'referenceId must be a string',
      };
    }

    if (row.referenceId.includes('$')) {
      return {
        lineNumber: i + 1,
        column: GenericRegistrationAttributes.referenceId,
        value: row.referenceId,
        error: `${GenericRegistrationAttributes.referenceId} contains a $ character`,
      };
    }

    if (row.referenceId.length < 5 || row.referenceId.length > 200) {
      return {
        lineNumber: i + 1,
        column: GenericRegistrationAttributes.referenceId,
        value: row.referenceId,
        error: 'referenceId must be between 5 and 200 characters',
      };
    }
    if (validationConfig.validateExistingReferenceId) {
      const registration = await this.registrationRepository.findOne({
        where: { referenceId: Equal(row.referenceId) },
      });
      if (registration) {
        return {
          lineNumber: i + 1,
          column: GenericRegistrationAttributes.referenceId,
          value: row.referenceId,
          error: 'referenceId already exists in database',
        };
      }
    }
  }

  private validatePhoneNumberEmpty({
    row,
    i,
    program,
    typeOfInput,
  }: {
    row: Record<string, InputAttributeType>;
    i: number;
    program: ProgramEntity;
    typeOfInput: RegistrationValidationInputType;
  }): ValidateRegistrationErrorObject | undefined {
    // If the program allows empty phone numbers, skip this validation
    if (program.allowEmptyPhoneNumber) {
      return;
    }
    if (
      typeOfInput === RegistrationValidationInputType.create &&
      !row.phoneNumber
    ) {
      return {
        lineNumber: i + 1,
        column: GenericRegistrationAttributes.phoneNumber,
        value: undefined,
        error:
          'PhoneNumber is required when creating a new registration for this program. Set allowEmptyPhoneNumber to true in the program settings to allow empty phone numbers',
      };
    }

    if (
      typeOfInput === RegistrationValidationInputType.update &&
      row.phoneNumber === ''
    ) {
      // on an update phonenumber can be empty if it is not being updated
      return {
        lineNumber: i + 1,
        column: GenericRegistrationAttributes.phoneNumber,
        value: row.phoneNumber,
        error:
          'PhoneNumber is not allowed to be updated to an empty value. Set allowEmptyPhoneNumber to true in the program settings to allow empty phone numbers',
      };
    }
  }

  private async validateLookupPhoneNumber({
    value,
    i,
    phoneNumberLookupResults,
  }: {
    value: InputAttributeType;
    i: number;
    phoneNumberLookupResults: Record<string, string | undefined>;
  }): Promise<{
    errorObj?: ValidateRegistrationErrorObject;
    sanitized?: string;
  }> {
    let sanitized: string | undefined;
    const valueString = value ? value.toString() : '';
    if (phoneNumberLookupResults[valueString]) {
      sanitized = phoneNumberLookupResults[valueString];
    } else {
      sanitized = await this.lookupService.lookupAndCorrect(valueString, true);
    }
    if (!sanitized && !!value) {
      const errorObj: ValidateRegistrationErrorObject = {
        lineNumber: i + 1,
        column: 'phoneNumber',
        value,
        error:
          'This value is not a valid phonenumber according to Twilio lookup',
      };
      return { errorObj, sanitized };
    }
    return { errorObj: undefined, sanitized };
  }

  private validateFspRequiredAttributes({
    row,
    originalRegistration,
    programFspConfigurations: programFspConfigurations,
    i,
  }: {
    row: object;
    originalRegistration: MappedPaginatedRegistrationDto | undefined;
    programFspConfigurations: ProgramFspConfigurationEntity[];
    i: number;
  }): ValidateRegistrationErrorObject[] {
    // Decide which required attributes to check
    // If the updated row has a value a new fsp configuration name, check the required attributes for that fsp
    // Otherwise, check the required attributes for the original registration that is in the database

    const relevantFspConfigName =
      row[GenericRegistrationAttributes.programFspConfigurationName] ??
      originalRegistration?.programFspConfigurationName;
    if (!relevantFspConfigName) {
      // If the programFspConfigurationName is neither in the row nor in the original registration, we cannot check the required attributes
      // Errors will be thrown in a different validation step
      return [];
    }

    const requiredAttributes = this.getRequiredAttributesForFsp(
      relevantFspConfigName,
      programFspConfigurations,
    );
    const errors: ValidateRegistrationErrorObject[] = [];
    for (const attribute of requiredAttributes) {
      // Check if required attributes are not being deleted or set to nullable in the PATCH / POST request
      if (row.hasOwnProperty(attribute)) {
        if (row[attribute] == null || row[attribute] === '') {
          errors.push({
            lineNumber: i + 1,
            column: attribute,
            value: row[attribute],
            error: `Cannot update/set ${attribute} with a nullable value as it is required for the FSP: ${relevantFspConfigName}`,
          });
          continue;
        }
      }

      // If the programFspConfigurationName being updated / set in this request
      // check if a combination orignal registration and new row has all required attributes
      if (row[GenericRegistrationAttributes.programFspConfigurationName]) {
        // Check if the required attributes are present in the row
        if (
          !this.isRequiredAttributeInObject(attribute, row) &&
          !this.isRequiredAttributeInObject(attribute, originalRegistration)
        ) {
          errors.push({
            lineNumber: i + 1,
            column: attribute,
            value: undefined,
            error: `Cannot update '${attribute}' is required for the FSP: '${relevantFspConfigName}'`,
          });
        }
      }
    }
    return errors;
  }

  private isRequiredAttributeInObject(
    attribute: string,
    body: object | undefined,
  ): boolean {
    if (!body) {
      return false;
    }
    return (
      body.hasOwnProperty(attribute) &&
      body[attribute] != null &&
      body[attribute] !== ''
    );
  }

  private getRequiredAttributesForFsp(
    programFspConfigurationName: string,
    programFspConfigurations: ProgramFspConfigurationEntity[],
  ): string[] {
    const fspName = programFspConfigurations.find(
      (programFspConfig) =>
        programFspConfig.name === programFspConfigurationName,
    )?.fspName;
    const foundFsp = FSP_SETTINGS.find((fsp) => fsp.name === fspName);
    if (!foundFsp) {
      return [];
    }
    const requiredAttributes = foundFsp.attributes.filter(
      (attribute) => attribute.isRequired,
    );
    return requiredAttributes.map((attribute) => attribute.name);
  }

  private async getOriginalRegistrationsOrThrow(
    csvArray: object[],
    programId: number,
  ): Promise<Map<string, MappedPaginatedRegistrationDto>> {
    const referenceIds = csvArray
      .filter((row) => row[GenericRegistrationAttributes.referenceId])
      .map((row) => row[GenericRegistrationAttributes.referenceId]);
    const originalRegistrations =
      await this.registrationPaginationService.getRegistrationViewsChunkedByReferenceIds(
        { programId, referenceIds },
      );
    const originalRegistrationsMap = new Map(
      originalRegistrations.map((reg) => [reg.referenceId, reg]),
    );
    const notFoundIds = referenceIds.filter(
      (id) => !originalRegistrationsMap.has(id),
    );
    if (notFoundIds.length > 0) {
      throw new HttpException(
        `The following referenceIds were not found in the database: ${notFoundIds.join(', ')}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return originalRegistrationsMap;
  }

  // Basic here mean anything that is not a telephone number or a dropdown
  private validateTypesNumericBoolTextDate({
    value,
    type,
    attribute,
    i,
  }: {
    value: string[] | string | number | boolean | undefined | null;
    type: string;
    attribute: string;
    i: number;
  }): ValidateRegistrationErrorObject | undefined {
    let isValid: boolean | null = false;
    let message = '';
    if (type === RegistrationAttributeTypes.date) {
      const datePattern =
        /^(0?[1-9]|[12][0-9]|3[01])-(0?[1-9]|1[0-2])-(19[2-9][0-9]|20[0-1][0-9])$/;
      isValid = typeof value === 'string' && datePattern.test(value);
    } else if (type === RegistrationAttributeTypes.numeric) {
      isValid = value != null && !isNaN(+value);
    } else if (type === RegistrationAttributeTypes.numericNullable) {
      isValid = value == null || !isNaN(+value);
    } else if (type === RegistrationAttributeTypes.text) {
      isValid = typeof value === 'string';
    } else if (type === RegistrationAttributeTypes.boolean) {
      isValid = this.valueIsBool(value);
    } else {
      message = `Type '${type}' is unknown'`;
    }
    if (!isValid) {
      return {
        lineNumber: i + 1,
        column: attribute,
        value: Array.isArray(value) ? value.toString() : value,
        error: message
          ? message
          : this.createErrorMessageInvalidAttributeType({
              type,
              value,
              attribute,
            }),
      };
    }
  }

  private createErrorMessageInvalidAttributeType({
    type,
    value,
    attribute,
  }: {
    type: string;
    value: string[] | string | number | boolean | undefined | null;
    attribute: string;
  }): string {
    const valueString = Array.isArray(value) ? JSON.stringify(value) : value;
    return `The value '${valueString}' given for the attribute '${attribute}' does not have the correct format for type '${type}'`;
  }

  private valueIsBool(
    value: string[] | string | number | boolean | undefined | null,
  ): boolean {
    if (typeof value === 'boolean') {
      return true;
    }
    if (typeof value !== 'string') {
      return false;
    }
    const allowedValues = ['true', 'yes', '1', 'false', '0', 'no', null];
    return allowedValues.includes(value);
  }

  private validatePaymentAmountMultiplier({
    value,
    programPaymentAmountMultiplierFormula,
    i,
  }: {
    value: InputAttributeType;
    programPaymentAmountMultiplierFormula: string | null;
    i: number;
  }): {
    errorOjb?: ValidateRegistrationErrorObject | undefined;
    validatedPaymentAmountMultiplier?: number | undefined;
  } {
    if (programPaymentAmountMultiplierFormula && value != null) {
      return {
        errorOjb: {
          lineNumber: i + 1,
          column: GenericRegistrationAttributes.paymentAmountMultiplier,
          value,
          error:
            'Program has a paymentAmountMultiplierFormula, so the paymentAmountMultiplier should not be set as it will be calculated',
        },
      };
    }
    if (value == null) {
      // The value is not set, so no further validation is needed and the value will later be stored as 1
      return {
        validatedPaymentAmountMultiplier: undefined,
      };
    }
    if (isNaN(+value) || +value <= 0) {
      return {
        errorOjb: {
          lineNumber: i + 1,
          column: GenericRegistrationAttributes.paymentAmountMultiplier,
          value,
          error: 'this field must be a positive number',
        },
      };
    }
    return { validatedPaymentAmountMultiplier: +value };
  }

  private validateMaxPayments({
    value,
    originalRegistration,
    i,
  }: {
    value: InputAttributeType;
    originalRegistration: MappedPaginatedRegistrationDto | undefined;
    i: number;
  }): {
    errorObj?: ValidateRegistrationErrorObject | undefined;
    validatedMaxPayments?: number | undefined;
  } {
    // It's always allowed to remove the maxPayments value
    // When you upload a csv file, the value is an empty string
    if (value == null || value === '') {
      return { validatedMaxPayments: undefined };
    }
    if (isNaN(+value) || +value <= 0) {
      return {
        errorObj: {
          lineNumber: i + 1,
          column: GenericRegistrationAttributes.maxPayments,
          value,
          error: 'MaxPayments must be a positive number or left empty',
        },
      };
    }
    if (originalRegistration && +value < originalRegistration.paymentCount) {
      return {
        errorObj: {
          lineNumber: i + 1,
          column: GenericRegistrationAttributes.maxPayments,
          value,
          error: `MaxPayments cannot be lower than the current paymentCount (${originalRegistration.paymentCount})`,
        },
      };
    }
    return { validatedMaxPayments: +value };
  }
}
