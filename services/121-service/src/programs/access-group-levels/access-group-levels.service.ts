import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { AccessGroupLevelRepository } from '@121-service/src/programs/access-group-levels/access-group-level.repository';
import { AccessGroupAttributeUpdate } from '@121-service/src/programs/access-group-levels/interfaces/access-group-attribute-update.interface';
import { AccessGroupRegistrationAttribute } from '@121-service/src/programs/access-group-levels/interfaces/access-group-registration-attribute.interface';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationAttributeDataRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-attribute-data.repository';

@Injectable()
export class AccessGroupLevelsService {
  private static readonly MAX_ACCESS_GROUP_LEVELS = 3;

  public constructor(
    private readonly accessGroupLevelRepository: AccessGroupLevelRepository,
    private readonly registrationAttributeDataRepository: RegistrationAttributeDataRepository,
  ) {}

  public async updateAccessGroupLevels({
    programId,
    activeRegistrationAttributes,
    accessGroupRegistrationAttributeNames,
  }: {
    programId: number;
    activeRegistrationAttributes: AccessGroupRegistrationAttribute[];
    accessGroupRegistrationAttributeNames: string[];
  }): Promise<string[]> {
    const validatedNames = this.validateAccessGroupRegistrationAttributeNames({
      programId,
      activeRegistrationAttributes,
      selectedAttributeNames: accessGroupRegistrationAttributeNames,
    });

    const attributeIdByName = new Map(
      activeRegistrationAttributes.map((attribute) => [
        attribute.name,
        attribute.id,
      ]),
    );

    await this.accessGroupLevelRepository.replaceForProgram({
      programId,
      orderedProgramRegistrationAttributeIds: validatedNames.map(
        (name) => attributeIdByName.get(name) as number,
      ),
    });

    return validatedNames;
  }

  public async getAccessGroupRegistrationAttributeNames({
    programId,
  }: {
    programId: number;
  }): Promise<string[]> {
    return this.accessGroupLevelRepository.findOrderedAttributeNamesByProgramId(
      { programId },
    );
  }

  public validateAccessGroupRegistrationAttributeNames({
    programId,
    activeRegistrationAttributes,
    selectedAttributeNames,
  }: {
    programId: number;
    activeRegistrationAttributes: Pick<
      AccessGroupRegistrationAttribute,
      'name' | 'type'
    >[];
    selectedAttributeNames: string[] | null;
  }): string[] {
    if (!selectedAttributeNames || selectedAttributeNames.length === 0) {
      return [];
    }

    const duplicateName = selectedAttributeNames.find(
      (name, index) => selectedAttributeNames.indexOf(name) !== index,
    );
    if (duplicateName) {
      throw new HttpException(
        `Registration attribute '${duplicateName}' is duplicated in the access group configuration`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      selectedAttributeNames.length >
      AccessGroupLevelsService.MAX_ACCESS_GROUP_LEVELS
    ) {
      throw new HttpException(
        `Access group calculation cannot have more than ${AccessGroupLevelsService.MAX_ACCESS_GROUP_LEVELS} attributes`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const activeAttributeNames = new Set(
      activeRegistrationAttributes.map((attribute) => attribute.name),
    );
    const missingName = selectedAttributeNames.find(
      (name) => !activeAttributeNames.has(name),
    );
    if (missingName) {
      throw new HttpException(
        `Registration attribute '${missingName}' does not exist in program ${programId}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const selectedNames = new Set(selectedAttributeNames);
    const nonDropdownAttribute = activeRegistrationAttributes.find(
      (attribute) =>
        selectedNames.has(attribute.name) &&
        attribute.type !== RegistrationAttributeTypes.dropdown,
    );
    if (nonDropdownAttribute) {
      throw new HttpException(
        `Registration attribute '${nonDropdownAttribute.name}' must be of type '${RegistrationAttributeTypes.dropdown}' for access group calculation`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return selectedAttributeNames;
  }

  public async validateAttributeUpdateAllowed({
    accessGroupRegistrationAttributeNames,
    existingAttribute,
    update,
  }: {
    accessGroupRegistrationAttributeNames: string[];
    existingAttribute: AccessGroupRegistrationAttribute;
    update: AccessGroupAttributeUpdate;
  }): Promise<void> {
    const isTypeViolated = this.isAccessGroupAttributeTypeViolated({
      accessGroupRegistrationAttributeNames,
      existingAttribute,
      type: update.type,
    });
    if (isTypeViolated) {
      throw new HttpException(
        `The '${existingAttribute.name}' attribute's type cannot be changed while used for access group configuration.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const optionValuesInUse = await this.getOptionValuesInUseForAttribute({
      accessGroupRegistrationAttributeNames,
      existingAttribute,
      update,
    });

    const removedOptionValuesInUse =
      this.getAccessGroupAttributeOptionsViolation({
        accessGroupRegistrationAttributeNames,
        existingAttribute,
        update,
        optionValuesInUse,
      });
    if (removedOptionValuesInUse) {
      throw new HttpException(
        `The '${existingAttribute.name}' attribute's option(s) '${removedOptionValuesInUse.join("', '")}' cannot be removed while used for access group configuration.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public validateAttributeDeleteAllowed({
    accessGroupRegistrationAttributeNames,
    existingAttribute,
  }: {
    accessGroupRegistrationAttributeNames: string[];
    existingAttribute: Pick<AccessGroupRegistrationAttribute, 'name'>;
  }): void {
    if (
      !this.isAttributeLockedByAccessGroup({
        accessGroupRegistrationAttributeNames,
        attributeName: existingAttribute.name,
      })
    ) {
      return;
    }

    throw new HttpException(
      `The '${existingAttribute.name}' attribute cannot be deleted while used for access group configuration.`,
      HttpStatus.BAD_REQUEST,
    );
  }

  private isAttributeLockedByAccessGroup({
    accessGroupRegistrationAttributeNames,
    attributeName,
  }: {
    accessGroupRegistrationAttributeNames: string[];
    attributeName: string;
  }): boolean {
    return accessGroupRegistrationAttributeNames.includes(attributeName);
  }

  private getAccessGroupAttributeOptionsViolation({
    accessGroupRegistrationAttributeNames,
    existingAttribute,
    update,
    optionValuesInUse,
  }: {
    accessGroupRegistrationAttributeNames: string[];
    existingAttribute: AccessGroupRegistrationAttribute;
    update: AccessGroupAttributeUpdate;
    optionValuesInUse: Set<string>;
  }): string[] | undefined {
    if (
      !this.isAttributeLockedByAccessGroup({
        accessGroupRegistrationAttributeNames,
        attributeName: existingAttribute.name,
      })
    ) {
      return undefined;
    }

    const removedOptionValuesInUse = this.getRemovedOptionValues({
      existingOptions: existingAttribute.options,
      update,
    }).filter((optionValue) => optionValuesInUse.has(optionValue));

    return removedOptionValuesInUse.length > 0
      ? removedOptionValuesInUse
      : undefined;
  }

  public isAccessGroupAttributeTypeViolated({
    accessGroupRegistrationAttributeNames,
    existingAttribute,
    type,
  }: {
    accessGroupRegistrationAttributeNames: string[];
    existingAttribute: Pick<AccessGroupRegistrationAttribute, 'name'>;
    type: RegistrationAttributeTypes | undefined;
  }): boolean {
    if (
      !this.isAttributeLockedByAccessGroup({
        accessGroupRegistrationAttributeNames,
        attributeName: existingAttribute.name,
      })
    ) {
      return false;
    }

    return type !== undefined && type !== RegistrationAttributeTypes.dropdown;
  }

  private getRemovedOptionValues({
    existingOptions,
    update,
  }: {
    existingOptions: AccessGroupRegistrationAttribute['options'];
    update: AccessGroupAttributeUpdate;
  }): string[] {
    // The DTO skips options validation entirely when type isn't 'dropdown', so options can be null/non-array at runtime.
    if (!Array.isArray(update.options)) {
      return [];
    }

    const existingOptionValues = new Set(
      (existingOptions ?? []).map((option) => option.option),
    );
    const newOptionValues = new Set(
      update.options.map((option) => option.option),
    );
    return [...existingOptionValues].filter(
      (optionValue) => !newOptionValues.has(optionValue),
    );
  }

  private async getOptionValuesInUseForAttribute({
    accessGroupRegistrationAttributeNames,
    existingAttribute,
    update,
  }: {
    accessGroupRegistrationAttributeNames: string[];
    existingAttribute: AccessGroupRegistrationAttribute;
    update: AccessGroupAttributeUpdate;
  }): Promise<Set<string>> {
    if (
      !this.isAttributeLockedByAccessGroup({
        accessGroupRegistrationAttributeNames,
        attributeName: existingAttribute.name,
      })
    ) {
      return new Set();
    }

    const removedOptionValues = this.getRemovedOptionValues({
      existingOptions: existingAttribute.options,
      update,
    });
    if (removedOptionValues.length === 0) {
      return new Set();
    }

    // TODO: also check whether a removed option value is still assigned to an aid worker's
    // access group, once assignments have a proper relation to access group levels instead of a scope string.
    return this.registrationAttributeDataRepository.getValuesInUse({
      programRegistrationAttributeId: existingAttribute.id,
      optionValues: removedOptionValues,
    });
  }
}
