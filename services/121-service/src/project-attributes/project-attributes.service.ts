import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator } from 'nestjs-paginate';
import { Equal, Repository } from 'typeorm';

import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { ProjectRegistrationAttributeEntity } from '@121-service/src/projects/project-registration-attribute.entity';
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
export class ProjectAttributesService {
  @InjectRepository(ProjectEntity)
  private readonly projectRepository: Repository<ProjectEntity>;
  @InjectRepository(ProjectRegistrationAttributeEntity)
  private readonly projectRegistrationAttributeEntity: Repository<ProjectRegistrationAttributeEntity>;

  public getFilterableAttributes(project: ProjectEntity) {
    const genericPaAttributeFilters = [
      'personAffectedSequence',
      'referenceId',
      'phoneNumber',
      'preferredLanguage',
      'inclusionScore',
      'paymentAmountMultiplier',
      'projectFspConfigurationName',
    ];
    const paAttributesNameArray = project['paTableAttributes'].map(
      (paAttribute: Attribute) => paAttribute.name,
    );

    const paymentGroup = {
      group: 'payments',
      filters: ['paymentCount'],
    };
    if (project.enableMaxPayments) {
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
    projectId,
    includeProjectRegistrationAttributes,
    includeTemplateDefaultAttributes,
    filterShowInRegistrationsTable,
  }: {
    projectId: number;
    includeProjectRegistrationAttributes: boolean;
    includeTemplateDefaultAttributes: boolean;
    filterShowInRegistrationsTable?: boolean;
  }): Promise<Attribute[]> {
    let projectAttributes: Attribute[] = [];
    if (includeProjectRegistrationAttributes) {
      projectAttributes = await this.getAndMapProjectRegistrationAttributes(
        projectId,
        filterShowInRegistrationsTable,
      );
    }

    let templateDefaultAttributes: Attribute[] = [];
    if (includeTemplateDefaultAttributes) {
      templateDefaultAttributes =
        await this.getMessageTemplateDefaultAttributes(projectId);
    }

    return [...projectAttributes, ...templateDefaultAttributes];
  }

  private async getMessageTemplateDefaultAttributes(
    projectId: number,
  ): Promise<Attribute[]> {
    const hasMaxPayments = await this.projectRepository.findOne({
      where: { id: Equal(projectId) },
      select: ['enableMaxPayments'],
    });
    const defaultAttributes: Attribute[] = [
      {
        name: GenericRegistrationAttributes.paymentAmountMultiplier,
        type: RegistrationAttributeTypes.numeric,
        label: null,
      },
      {
        name: GenericRegistrationAttributes.projectFspConfigurationLabel,
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
    projectId: number,
  ): Promise<Attribute[]> {
    const projectRegistrationAttributes = (
      await this.projectRegistrationAttributeEntity.find({
        where: { project: { id: Equal(projectId) } },
      })
    ).map((c) => {
      return {
        name: c.name,
        type: c.type,
        label: c.label,
        isRequired: c.isRequired,
      };
    });
    return projectRegistrationAttributes;
  }

  private async getAndMapProjectRegistrationAttributes(
    projectId: number,
    filterShowInRegistrationsTable?: boolean,
  ): Promise<Attribute[]> {
    let queryRegistrationAttr = this.projectRegistrationAttributeEntity
      .createQueryBuilder('projectRegistrationAttribute')
      .where({ project: { id: projectId } });

    if (filterShowInRegistrationsTable) {
      queryRegistrationAttr = queryRegistrationAttr.andWhere({
        showInPeopleAffectedTable: true,
      });
    }
    const rawProjectAttributes = await queryRegistrationAttr.getMany();
    const projectAttributes = rawProjectAttributes.map((c) => {
      return {
        name: c.name,
        type: c.type,
        label: c.label,
        isRequired: c.isRequired,
      };
    });

    return projectAttributes;
  }
}
