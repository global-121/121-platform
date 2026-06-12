import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { chunk } from 'lodash';
import { FilterOperator } from 'nestjs-paginate';
import { Equal, In, QueryFailedError, Repository } from 'typeorm';

import {
  ProgramRegistrationAttributeDto,
  UpdateProgramRegistrationAttributeDto,
  UpdateProgramRegistrationAttributesBatchDto,
} from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { ProgramRegistrationAttributeMapper } from '@121-service/src/programs/mappers/program-registration-attribute.mapper';
import {
  AllowedFiltersNumber,
  AllowedFiltersString,
  PaginateConfigRegistrationView,
} from '@121-service/src/registration/const/filter-operation.const';
import { FilterAttributeDto } from '@121-service/src/registration/dto/filter-attribute.dto';
import {
  Attribute,
  GenericRegistrationAttributes,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { registrationViewAttributeNames } from '@121-service/src/shared/const';

@Injectable()
export class ProgramRegistrationAttributesService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramRegistrationAttributeEntity)
  private readonly programRegistrationAttributeRepository: Repository<ProgramRegistrationAttributeEntity>;

  public getFilterableAttributes(program: ProgramEntity) {
    const genericPaAttributeFilters = [
      'personAffectedSequence',
      'referenceId',
      'phoneNumber',
      'preferredLanguage',
      'inclusionScore',
      'paymentAmountMultiplier',
      'programFspConfigurationName',
    ];
    const paAttributesNameArray = program['paTableAttributes'].map(
      (paAttribute: Attribute) => paAttribute.name,
    );

    const paymentGroup = {
      group: 'payments',
      filters: ['paymentCount'],
    };
    if (program.enableMaxPayments) {
      paymentGroup.filters.push('maxPayments');
      paymentGroup.filters.push('paymentCountRemaining');
    }

    const filterableAttributeNames = [
      paymentGroup,
      {
        group: 'messages',
        filters: ['lastMessageStatus'],
      },
      {
        group: 'paAttributes',
        filters: [
          ...new Set([...genericPaAttributeFilters, ...paAttributesNameArray]),
        ],
      },
    ];

    const filterableAttributes: {
      group: string;
      filters: FilterAttributeDto[];
    }[] = [];
    for (const group of filterableAttributeNames) {
      const filterableAttributesPerGroup: FilterAttributeDto[] = [];
      for (const name of group.filters) {
        if (PaginateConfigRegistrationView.filterableColumns?.[name]) {
          filterableAttributesPerGroup.push({
            name,
            allowedOperators: PaginateConfigRegistrationView.filterableColumns[
              name
            ] as FilterOperator[],
            isInteger:
              PaginateConfigRegistrationView.filterableColumns[name] ===
              AllowedFiltersNumber,
          });
        } else {
          // If no allowed operators are defined than the attribute is
          // registration data which is stored as a string
          filterableAttributesPerGroup.push({
            name,
            allowedOperators: AllowedFiltersString,
            isInteger: false,
          });
        }
      }
      filterableAttributes.push({
        group: group.group,
        filters: filterableAttributesPerGroup,
      });
    }

    return filterableAttributes;
  }

  public async getAttributes({
    programId,
    includeProgramRegistrationAttributes,
    includeTemplateDefaultAttributes,
    filterShowInRegistrationsTable,
  }: {
    programId: number;
    includeProgramRegistrationAttributes: boolean;
    includeTemplateDefaultAttributes: boolean;
    filterShowInRegistrationsTable?: boolean;
  }): Promise<Attribute[]> {
    let programAttributes: Attribute[] = [];
    if (includeProgramRegistrationAttributes) {
      programAttributes = await this.getAndMapProgramRegistrationAttributes(
        programId,
        filterShowInRegistrationsTable,
      );
    }

    let templateDefaultAttributes: Attribute[] = [];
    if (includeTemplateDefaultAttributes) {
      templateDefaultAttributes =
        await this.getMessageTemplateDefaultAttributes(programId);
    }

    return [...programAttributes, ...templateDefaultAttributes];
  }

  private async getMessageTemplateDefaultAttributes(
    programId: number,
  ): Promise<Attribute[]> {
    const hasMaxPayments = await this.programRepository.findOne({
      where: { id: Equal(programId) },
      select: ['enableMaxPayments'],
    });
    const defaultAttributes: Attribute[] = [
      {
        name: GenericRegistrationAttributes.paymentAmountMultiplier,
        type: RegistrationAttributeTypes.numeric,
        label: null,
      },
      {
        name: GenericRegistrationAttributes.programFspConfigurationLabel,
        type: RegistrationAttributeTypes.text,
        label: null,
      },
    ];
    if (hasMaxPayments?.enableMaxPayments) {
      defaultAttributes.push({
        name: GenericRegistrationAttributes.maxPayments,
        type: RegistrationAttributeTypes.numeric,
        label: null,
      });
      defaultAttributes.push({
        name: GenericRegistrationAttributes.paymentCountRemaining,
        type: RegistrationAttributeTypes.numeric,
        label: null,
      });
    }
    return defaultAttributes;
  }

  public async getPaEditableAttributes(
    programId: number,
  ): Promise<Attribute[]> {
    const programRegistrationAttributes = (
      await this.programRegistrationAttributeRepository.find({
        where: { program: { id: Equal(programId) } },
      })
    ).map((c) => {
      return {
        name: c.name,
        type: c.type,
        label: c.label,
        isRequired: c.isRequired,
      };
    });
    return programRegistrationAttributes;
  }

  private async getAndMapProgramRegistrationAttributes(
    programId: number,
    filterShowInRegistrationsTable?: boolean,
  ): Promise<Attribute[]> {
    let queryRegistrationAttr = this.programRegistrationAttributeRepository
      .createQueryBuilder('programRegistrationAttribute')
      .orderBy('programRegistrationAttribute.created', 'ASC')
      .where({ program: { id: programId } });

    if (filterShowInRegistrationsTable) {
      queryRegistrationAttr = queryRegistrationAttr.andWhere({
        showInPeopleAffectedTable: true,
      });
    }
    const rawProgramAttributes = await queryRegistrationAttr.getMany();
    const programAttributes = rawProgramAttributes.map((c) => {
      return {
        name: c.name,
        type: c.type,
        label: c.label,
        koboLabel: c.koboLabel,
        isRequired: c.isRequired,
      };
    });

    return programAttributes;
  }

  public async applyProgramRegistrationAttributesFallbackIfNecessary({
    attributesData,
    namingConventionData,
  }: {
    attributesData: ProgramRegistrationAttributeDto[] | undefined;
    namingConventionData: string[];
  }): Promise<ProgramRegistrationAttributeDto[]> {
    const programRegistrationAttributes = attributesData ?? [];

    // make sure phoneNumber is in programRegistrationAttributes

    if (
      !programRegistrationAttributes.find((attr) => attr.name === 'phoneNumber')
    ) {
      programRegistrationAttributes.push({
        name: 'phoneNumber',
        type: RegistrationAttributeTypes.text,
        label: { en: 'Phone number' },
      });
    }

    // make sure all fullnameNamingConventions are in programRegistrationAttributes

    const registrationAttributesNames = programRegistrationAttributes.map(
      (attr) => attr.name,
    );
    const missingNamingConventions = namingConventionData.filter(
      (attr) => !registrationAttributesNames.includes(attr),
    );

    if (missingNamingConventions.length > 0) {
      for (const missingNamingConvention of missingNamingConventions) {
        programRegistrationAttributes.push({
          name: missingNamingConvention,
          type: RegistrationAttributeTypes.text,
          label: {
            en:
              missingNamingConvention === 'fullName'
                ? 'Full name'
                : missingNamingConvention,
          },
        });
      }
    }

    return programRegistrationAttributes;
  }

  public async upsertProgramRegistrationAttributes({
    programId,
    programRegistrationAttributes,
  }: {
    programId: number;
    programRegistrationAttributes: ProgramRegistrationAttributeDto[];
  }): Promise<void> {
    // Fetch all existing attributes for this program in one query
    const existingAttributes =
      await this.programRegistrationAttributeRepository.find({
        where: { programId: Equal(programId) },
      });

    const existingAttributesMap = new Map(
      existingAttributes.map((attr) => [attr.name, attr]),
    );

    const entitiesToSave: ProgramRegistrationAttributeEntity[] = [];

    for (const attribute of programRegistrationAttributes) {
      const existingAttribute = existingAttributesMap.get(attribute.name);

      if (existingAttribute) {
        // Update existing attribute
        for (const key in attribute) {
          existingAttribute[key] = attribute[key];
        }
        entitiesToSave.push(existingAttribute);
      } else {
        // Create new attribute
        const newAttribute =
          this.programRegistrationAttributeDtoToEntity(attribute);
        newAttribute.programId = programId;
        entitiesToSave.push(newAttribute);
      }
    }
    await this.programRegistrationAttributeRepository.save(entitiesToSave);
  }

  public async createProgramRegistrationAttribute({
    programId,
    createProgramRegistrationAttributeDto,
  }: {
    programId: number;
    createProgramRegistrationAttributeDto: ProgramRegistrationAttributeDto;
  }): Promise<ProgramRegistrationAttributeDto> {
    const entity = await this.createProgramRegistrationAttributeEntity({
      programId,
      createProgramRegistrationAttributeDto,
    });
    return ProgramRegistrationAttributeMapper.entityToDto(entity);
  }

  private async validateAttributeName(
    programId: number,
    name: string,
  ): Promise<void> {
    const existingAttributes = await this.getAttributes({
      programId,
      includeProgramRegistrationAttributes: true,
      includeTemplateDefaultAttributes: false,
    });
    const existingNames = existingAttributes.map((attr) => {
      return attr.name;
    });
    if (existingNames.includes(name)) {
      const errors = `Unable to create program registration attribute with name ${name}. The names ${existingNames.join(
        ', ',
      )} are already in use`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    if (registrationViewAttributeNames.includes(name)) {
      const errors = `Unable to create program registration attribute with name ${name}. The names ${registrationViewAttributeNames.join(
        ', ',
      )} are forbidden to use`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
  }

  public async createProgramRegistrationAttributeEntity({
    programId,
    createProgramRegistrationAttributeDto,
    repository,
  }: {
    programId: number;
    createProgramRegistrationAttributeDto: ProgramRegistrationAttributeDto;
    repository?: Repository<ProgramRegistrationAttributeEntity>;
  }): Promise<ProgramRegistrationAttributeEntity> {
    await this.validateAttributeName(
      programId,
      createProgramRegistrationAttributeDto.name,
    );
    const programRegistrationAttribute =
      this.programRegistrationAttributeDtoToEntity(
        createProgramRegistrationAttributeDto,
      );
    programRegistrationAttribute.programId = programId;

    try {
      if (repository) {
        return await repository.save(programRegistrationAttribute);
      } else {
        return await this.programRegistrationAttributeRepository.save(
          programRegistrationAttribute,
        );
      }
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const errorMessage = error.message; // Get the error message from QueryFailedError
        throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
      }
      // Unexpected error
      throw error;
    }
  }

  private programRegistrationAttributeDtoToEntity(
    dto: ProgramRegistrationAttributeDto,
  ): ProgramRegistrationAttributeEntity {
    const programRegistrationAttribute =
      new ProgramRegistrationAttributeEntity();
    programRegistrationAttribute.name = dto.name;
    programRegistrationAttribute.label = dto.label ?? null;
    programRegistrationAttribute.koboLabel = dto.koboLabel ?? null;
    programRegistrationAttribute.type = dto.type;
    programRegistrationAttribute.options = dto.options ?? null;
    programRegistrationAttribute.scoring = dto.scoring ?? {};
    programRegistrationAttribute.pattern = dto.pattern ?? null;
    programRegistrationAttribute.editableInPortal =
      dto.editableInPortal ?? true;
    programRegistrationAttribute.includeInTransactionExport =
      dto.includeInTransactionExport ?? false;
    programRegistrationAttribute.duplicateCheck = dto.duplicateCheck ?? false;
    programRegistrationAttribute.placeholder = dto.placeholder ?? null;
    programRegistrationAttribute.isRequired = dto.isRequired ?? false;
    programRegistrationAttribute.showInPeopleAffectedTable =
      dto.showInPeopleAffectedTable ?? false;
    return programRegistrationAttribute;
  }

  public async updateProgramRegistrationAttribute({
    programId,
    programRegistrationAttributeName,
    updateProgramRegistrationAttribute,
  }: {
    programId: number;
    programRegistrationAttributeName: string;
    updateProgramRegistrationAttribute: UpdateProgramRegistrationAttributeDto;
  }): Promise<ProgramRegistrationAttributeEntity> {
    const programRegistrationAttributeFromRepo =
      await this.programRegistrationAttributeRepository.findOne({
        where: {
          name: Equal(programRegistrationAttributeName),
          programId: Equal(programId),
        },
      });
    if (!programRegistrationAttributeFromRepo) {
      const errors = `No programRegistrationAttribute found with name ${programRegistrationAttributeName} for program ${programId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const updatedProgramRegistrationAttribute =
      await this.getUpdatedProgramRegistrationAttribute({
        programRegistrationAttributeFromRepo,
        updateProgramRegistrationAttribute,
      });

    await this.programRegistrationAttributeRepository.save(
      updatedProgramRegistrationAttribute,
    );
    return updatedProgramRegistrationAttribute;
  }

  private validateNoDuplicateNamesInBatch({
    attributesToUpdate,
  }: {
    attributesToUpdate: UpdateProgramRegistrationAttributesBatchDto[];
  }): void {
    const names = attributesToUpdate.map(
      (attr) => attr.programRegistrationAttributeName,
    );
    const duplicateNames = names.filter(
      (name, index) => names.indexOf(name) !== index,
    );

    if (duplicateNames.length > 0) {
      const errors = `Duplicate programRegistrationAttributeName values are not allowed: ${[
        ...new Set(duplicateNames),
      ].join(', ')}`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
  }

  public async updateBatchProgramRegistrationAttributes({
    programId,
    attributesToUpdate,
  }: {
    programId: number;
    attributesToUpdate: UpdateProgramRegistrationAttributesBatchDto[];
  }): Promise<ProgramRegistrationAttributeEntity[]> {
    this.validateNoDuplicateNamesInBatch({ attributesToUpdate });

    const attributesToUpdateNames = attributesToUpdate.map(
      (attr) => attr.programRegistrationAttributeName,
    );
    const attributesFromRepoNames = new Set(
      (
        await this.programRegistrationAttributeRepository.find({
          where: {
            name: In(attributesToUpdateNames),
            programId: Equal(programId),
          },
        })
      ).map((attr) => attr.name),
    );

    const namesNotFound = attributesToUpdateNames.filter(
      (attributeName) => !attributesFromRepoNames.has(attributeName),
    );
    if (namesNotFound.length > 0) {
      const errors = `No programRegistrationAttribute found with name ${namesNotFound.join(', ')} for program ${programId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const updatedAttributes: ProgramRegistrationAttributeEntity[] = [];

    const chunks = chunk(attributesToUpdate, 10000);

    for (const programAttributesToUpdateChunk of chunks) {
      const updatedChunk = await this.getUpdatedProgramAttributePerChunk({
        programId,
        programAttributesToUpdateChunk,
      });
      updatedAttributes.push(...updatedChunk);
    }
    await this.programRegistrationAttributeRepository.save(updatedAttributes);

    return updatedAttributes;
  }

  private async getUpdatedProgramAttributePerChunk({
    programId,
    programAttributesToUpdateChunk,
  }: {
    programId: number;
    programAttributesToUpdateChunk: UpdateProgramRegistrationAttributesBatchDto[];
  }) {
    const updatedChunk: ProgramRegistrationAttributeEntity[] = [];

    const programAttributesToUpdateNames = programAttributesToUpdateChunk.map(
      (attr) => attr.programRegistrationAttributeName,
    );

    const programRegistrationAttributesFromRepo =
      await this.programRegistrationAttributeRepository.find({
        where: {
          name: In(programAttributesToUpdateNames),
          programId: Equal(programId),
        },
      });

    for (const programRegistrationAttributeFromRepo of programRegistrationAttributesFromRepo) {
      const attributeWithUpdates = programAttributesToUpdateChunk.find(
        (attr) =>
          attr.programRegistrationAttributeName ===
          programRegistrationAttributeFromRepo.name,
      );

      const updatedProgramRegistrationAttribute =
        await this.getUpdatedProgramRegistrationAttribute({
          programRegistrationAttributeFromRepo,
          updateProgramRegistrationAttribute:
            attributeWithUpdates!.updateProgramRegistrationAttribute,
        });

      updatedChunk.push(updatedProgramRegistrationAttribute);
    }

    return updatedChunk;
  }

  private async getUpdatedProgramRegistrationAttribute({
    programRegistrationAttributeFromRepo,
    updateProgramRegistrationAttribute,
  }: {
    programRegistrationAttributeFromRepo: ProgramRegistrationAttributeEntity;
    updateProgramRegistrationAttribute: UpdateProgramRegistrationAttributeDto;
  }) {
    for (const attribute in updateProgramRegistrationAttribute) {
      programRegistrationAttributeFromRepo[attribute] =
        updateProgramRegistrationAttribute[attribute];
    }

    return programRegistrationAttributeFromRepo;
  }

  public async deleteProgramRegistrationAttribute(
    programId: number,
    programRegistrationAttributeId: number,
  ): Promise<ProgramRegistrationAttributeEntity> {
    const programRegistrationAttribute =
      await this.programRegistrationAttributeRepository.findOne({
        where: {
          id: Equal(programRegistrationAttributeId),
          programId: Equal(programId),
        },
      });
    if (!programRegistrationAttribute) {
      const errors = `Program registration attribute with id: '${programRegistrationAttributeId}' not found for program '${programId}'.`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return await this.programRegistrationAttributeRepository.remove(
      programRegistrationAttribute,
    );
  }
}
