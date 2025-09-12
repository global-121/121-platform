import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator } from 'nestjs-paginate';
import { Equal, Repository } from 'typeorm';

import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
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

@Injectable()
export class ProgramAttributesService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramRegistrationAttributeEntity)
  private readonly programRegistrationAttributeEntity: Repository<ProgramRegistrationAttributeEntity>;

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
      await this.programRegistrationAttributeEntity.find({
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
    let queryRegistrationAttr = this.programRegistrationAttributeEntity
      .createQueryBuilder('programRegistrationAttribute')
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
        isRequired: c.isRequired,
      };
    });

    return programAttributes;
  }
}
