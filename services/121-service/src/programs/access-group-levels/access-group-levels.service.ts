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
      orderedProgramRegistrationAttributeIds: (validatedNames ?? []).map(
        (name) => attributeIdByName.get(name) as number,
      ),
    });

    return validatedNames ?? [];
  }

  public async getAccessGroupRegistrationAttributeNames({
    programId,
  }: {
    programId: number;
  }): Promise<string[] | null> {
    return this.accessGroupLevelRepository.findOrderedAttributeNamesByProgramId(
      { programId },
    );
  }

  public async getAccessGroupLevels({
    programId,
  }: {
    programId: number;
  }): Promise<string[]> {
    const accessGroupRegistrationAttributeNames =
      await this.getAccessGroupRegistrationAttributeNames({ programId });
    return accessGroupRegistrationAttributeNames ?? [];
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
  }): string[] | null {
    if (!selectedAttributeNames || selectedAttributeNames.length === 0) {
      return null;
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

    const foundAttributeNames = this.filterProgramRegistrationAttributeByNames({
      programRegistrationAttributeNames: activeRegistrationAttributes.map(
        (attribute) => attribute.name,
      ),
      filterNames: selectedAttributeNames,
    });

    const foundNames = new Set(foundAttributeNames);
    const missingName = selectedAttributeNames.find(
      (name) => !foundNames.has(name),
    );
    if (missingName) {
      throw new HttpException(
        `Registration attribute '${missingName}' does not exist in program ${programId}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const nonDropdownAttribute = activeRegistrationAttributes.find(
      (attribute) =>
        foundNames.has(attribute.name) &&
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

  private filterProgramRegistrationAttributeByNames({
    programRegistrationAttributeNames,
    filterNames,
  }: {
    programRegistrationAttributeNames: string[];
    filterNames: string[] | null;
  }): string[] {
    if (!filterNames || filterNames.length === 0) {
      return [];
    }

    const accessGroupNames = new Set(filterNames);
    return programRegistrationAttributeNames.filter((attributeName) =>
      accessGroupNames.has(attributeName),
    );
  }

  public async validateAttributeUpdateAllowed({
    accessGroupRegistrationAttributeNames,
    existingAttribute,
    update,
  }: {
    accessGroupRegistrationAttributeNames: string[] | null;
    existingAttribute: AccessGroupRegistrationAttribute;
    update: AccessGroupAttributeUpdate;
  }): Promise<void> {
    const typeViolation = this.getAccessGroupAttributeTypeViolation({
      accessGroupRegistrationAttributeNames,
      existingAttribute,
      type: update.type,
    });
    if (typeViolation) {
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
    accessGroupRegistrationAttributeNames: string[] | null;
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
    accessGroupRegistrationAttributeNames: string[] | null;
    attributeName: string;
  }): boolean {
    return (accessGroupRegistrationAttributeNames ?? []).includes(
      attributeName,
    );
  }

  private getAccessGroupAttributeOptionsViolation({
    accessGroupRegistrationAttributeNames,
    existingAttribute,
    update,
    optionValuesInUse,
  }: {
    accessGroupRegistrationAttributeNames: string[] | null;
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

  public getAccessGroupAttributeTypeViolation({
    accessGroupRegistrationAttributeNames,
    existingAttribute,
    type,
  }: {
    accessGroupRegistrationAttributeNames: string[] | null;
    existingAttribute: Pick<AccessGroupRegistrationAttribute, 'name'>;
    type: RegistrationAttributeTypes | undefined;
  }): { reason: 'type' } | undefined {
    if (
      !this.isAttributeLockedByAccessGroup({
        accessGroupRegistrationAttributeNames,
        attributeName: existingAttribute.name,
      })
    ) {
      return undefined;
    }

    return this.isTypeViolation({ type }) ? { reason: 'type' } : undefined;
  }

  private isTypeViolation({
    type,
  }: {
    type: RegistrationAttributeTypes | undefined;
  }): boolean {
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
    accessGroupRegistrationAttributeNames: string[] | null;
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
