import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { TwilioMode } from '@121-service/src/notifications/enum/twilio-mode.enum';
import { UpdateProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import {
  DefaultRegistrationDataAttributeNames,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';

export type ProgramRegistrationAttributeChange =
  | 'delete'
  | Partial<Pick<UpdateProgramRegistrationAttributeDto, 'options' | 'type'>>;

// This service centralizes the checks that determine whether a program registration attribute
// is "locked": either because it is relied upon by Twilio, or because it is used for dynamic
// scope configuration. Deleting or changing a locked attribute in an incompatible way is rejected.
@Injectable()
export class ProgramRegistrationAttributeLockService {
  private static readonly MAX_SCOPE_LEVELS = 3;

  public validateScopeRegistrationAttributeNames({
    programId,
    programRegistrationAttributes,
    attributeNames,
  }: {
    programId: number;
    programRegistrationAttributes: ProgramRegistrationAttributeEntity[];
    attributeNames: string[] | null;
  }): string[] | null {
    if (!attributeNames || attributeNames.length === 0) {
      return null;
    }

    if (
      attributeNames.length >
      ProgramRegistrationAttributeLockService.MAX_SCOPE_LEVELS
    ) {
      throw new HttpException(
        `Scope calculation cannot have more than ${ProgramRegistrationAttributeLockService.MAX_SCOPE_LEVELS} attributes`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const attributeByName = new Map(
      programRegistrationAttributes.map((attribute) => [
        attribute.name,
        attribute,
      ]),
    );

    for (const name of attributeNames) {
      const attribute = attributeByName.get(name);
      if (!attribute) {
        throw new HttpException(
          `Registration attribute '${name}' does not exist in program ${programId}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (attribute.type !== RegistrationAttributeTypes.dropdown) {
        throw new HttpException(
          `Registration attribute '${name}' must be of type '${RegistrationAttributeTypes.dropdown}' for scope calculation`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return attributeNames;
  }

  public validateAttributeChangeAllowed({
    scopeRegistrationAttributeNames,
    existingAttribute,
    change,
  }: {
    scopeRegistrationAttributeNames: string[] | null;
    existingAttribute: ProgramRegistrationAttributeEntity;
    change: ProgramRegistrationAttributeChange;
  }): void {
    if (change === 'delete') {
      this.validateNotLockedByTwilio(existingAttribute);
    }

    this.validateNotLockedByScope({
      scopeRegistrationAttributeNames,
      existingAttribute,
      change,
    });
  }

  // Twilio needs a phoneNumber to send messages, so it cannot be removed while Twilio is enabled.
  private validateNotLockedByTwilio(
    existingAttribute: ProgramRegistrationAttributeEntity,
  ): void {
    if (
      env.TWILIO_MODE !== TwilioMode.disabled &&
      existingAttribute.name ===
        DefaultRegistrationDataAttributeNames.phoneNumber
    ) {
      throw new HttpException(
        `The '${DefaultRegistrationDataAttributeNames.phoneNumber}' attribute cannot be deleted while Twilio is enabled.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateNotLockedByScope({
    scopeRegistrationAttributeNames,
    existingAttribute,
    change,
  }: {
    scopeRegistrationAttributeNames: string[] | null;
    existingAttribute: ProgramRegistrationAttributeEntity;
    change: ProgramRegistrationAttributeChange;
  }): void {
    const isLockedByScope = (scopeRegistrationAttributeNames ?? []).includes(
      existingAttribute.name,
    );
    if (!isLockedByScope) {
      return;
    }

    if (change === 'delete') {
      throw new HttpException(
        `The '${existingAttribute.name}' attribute cannot be deleted while used for scope configuration.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      change.type !== undefined &&
      change.type !== RegistrationAttributeTypes.dropdown
    ) {
      throw new HttpException(
        `The '${existingAttribute.name}' attribute's type cannot be changed while used for scope configuration.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (change.options !== undefined) {
      const existingOptionValues = new Set(
        (existingAttribute.options ?? []).map((option) => option.option),
      );
      const newOptionValues = new Set(
        (change.options ?? []).map((option) => option.option),
      );
      const removedOptionValues = [...existingOptionValues].filter(
        (optionValue) => !newOptionValues.has(optionValue),
      );

      if (removedOptionValues.length > 0) {
        throw new HttpException(
          `The '${existingAttribute.name}' attribute's option(s) '${removedOptionValues.join("', '")}' cannot be removed while used for scope configuration.`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }
}
