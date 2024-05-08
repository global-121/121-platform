import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator } from 'nestjs-paginate';
import { In, Repository } from 'typeorm';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { ProgramCustomAttributeEntity } from '../programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { ProgramEntity } from '../programs/program.entity';
import {
  AllowedFilterOperatorsNumber,
  AllowedFilterOperatorsString,
  PaginateConfigRegistrationViewWithPayments,
} from '../registration/const/filter-operation.const';
import { FilterAttributeDto } from '../registration/dto/filter-attribute.dto';
import {
  Attribute,
  QuestionType,
} from '../registration/enum/custom-data-attributes';
@Injectable()
export class ProgramAttributesService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramQuestionEntity)
  private readonly programQuestionRepository: Repository<ProgramQuestionEntity>;
  @InjectRepository(ProgramCustomAttributeEntity)
  private readonly programCustomAttributeRepository: Repository<ProgramCustomAttributeEntity>;
  @InjectRepository(FspQuestionEntity)
  private readonly fspQuestionRepository: Repository<FspQuestionEntity>;

  public getFilterableAttributes(
    program: ProgramEntity,
  ): { group: string; filters: FilterAttributeDto[] }[] {
    const genericPaAttributeFilters = [
      'personAffectedSequence',
      'referenceId',
      'registrationCreatedDate',
      'phoneNumber',
      'preferredLanguage',
      'inclusionScore',
      'paymentAmountMultiplier',
      'financialServiceProvider',
    ];
    const paAttributesNameArray = program['paTableAttributes'].map(
      (paAttribute: Attribute) => paAttribute.name,
    );

    let filterableAttributeNames = [
      {
        group: 'payments',
        filters: [
          'failedPayment',
          'waitingPayment',
          'successPayment',
          'notYetSentPayment',
        ],
      },
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
    if (program.enableMaxPayments) {
      filterableAttributeNames = [
        ...filterableAttributeNames,
        ...[
          {
            group: 'maxPayments',
            filters: ['maxPayments', 'paymentCount', 'paymentCountRemaining'],
          },
        ],
      ];
    }

    const filterableAttributes = [];
    for (const group of filterableAttributeNames) {
      const filterableAttributesPerGroup: FilterAttributeDto[] = [];
      for (const name of group.filters) {
        if (
          PaginateConfigRegistrationViewWithPayments.filterableColumns[name]
        ) {
          filterableAttributesPerGroup.push({
            name: name,
            allowedOperators: PaginateConfigRegistrationViewWithPayments
              .filterableColumns[name] as FilterOperator[],
            isInteger:
              PaginateConfigRegistrationViewWithPayments.filterableColumns[
                name
              ] === AllowedFilterOperatorsNumber,
          });
        } else {
          // If no allowed operators are defined than the attribute is
          // registration data which is stored as a string
          filterableAttributesPerGroup.push({
            name: name,
            allowedOperators: AllowedFilterOperatorsString,
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

  public async getAttributes(
    programId: number,
    includeCustomAttributes: boolean,
    includeProgramQuestions: boolean,
    includeFspQuestions: boolean,
    includeTemplateDefaultAttributes: boolean,
    filterShowInPeopleAffectedTable?: boolean,
  ): Promise<Attribute[]> {
    let customAttributes = [];
    if (includeCustomAttributes) {
      customAttributes = await this.getAndMapProgramCustomAttributes(
        programId,
        filterShowInPeopleAffectedTable,
      );
    }
    let programQuestions = [];
    if (includeProgramQuestions) {
      programQuestions = await this.getAndMapProgramQuestions(
        programId,
        filterShowInPeopleAffectedTable,
      );
    }
    let fspQuestions = [];
    if (includeFspQuestions) {
      fspQuestions = await this.getAndMapProgramFspQuestions(
        programId,
        filterShowInPeopleAffectedTable,
      );
    }

    let templateDefaultAttributes = [];
    if (includeTemplateDefaultAttributes) {
      templateDefaultAttributes =
        await this.getMessageTemplateDefaultAttributes(programId);
    }

    return [
      ...customAttributes,
      ...programQuestions,
      ...fspQuestions,
      ...templateDefaultAttributes,
    ];
  }

  private async getMessageTemplateDefaultAttributes(
    programId: number,
  ): Promise<Attribute[]> {
    const hasMaxPayments = await this.programRepository.findOne({
      where: { id: programId },
      select: ['enableMaxPayments'],
    });
    const defaultAttributes = [
      {
        name: 'paymentAmountMultiplier',
        type: 'numeric',
        label: null,
      },
      {
        name: 'fspDisplayName',
        type: 'text',
        label: null,
      },
    ];
    if (hasMaxPayments) {
      defaultAttributes.push({
        name: 'maxPayments',
        type: 'numeric',
        label: null,
      });
    }
    return defaultAttributes;
  }

  public async getPaEditableAttributes(
    programId: number,
  ): Promise<Attribute[]> {
    const customAttributes = (
      await this.programCustomAttributeRepository.find({
        where: { program: { id: programId } },
      })
    ).map((c) => {
      return {
        name: c.name,
        type: c.type,
        label: c.label,
      };
    });
    const programQuestions = (
      await this.programQuestionRepository.find({
        where: { program: { id: programId }, editableInPortal: true },
      })
    ).map((c) => {
      return {
        name: c.name,
        type: c.answerType,
        label: c.label,
      };
    });

    return [...customAttributes, ...programQuestions];
  }

  private async getAndMapProgramQuestions(
    programId: number,
    filterShowInPeopleAffectedTable?: boolean,
  ): Promise<Attribute[]> {
    let queryProgramQuestions = this.programQuestionRepository
      .createQueryBuilder('programQuestion')
      .where({ program: { id: programId } });

    if (filterShowInPeopleAffectedTable) {
      queryProgramQuestions = queryProgramQuestions.andWhere({
        showInPeopleAffectedTable: true,
      });
    }
    const rawProgramQuestions = await queryProgramQuestions.getMany();
    const programQuestions = rawProgramQuestions.map((c) => {
      return {
        name: c.name,
        type: c.answerType,
        label: c.label,
        questionType: QuestionType.programQuestion,
      };
    });

    return programQuestions;
  }
  private async getAndMapProgramCustomAttributes(
    programId: number,
    filterShowInPeopleAffectedTable?: boolean,
  ): Promise<Attribute[]> {
    let queryCustomAttr = this.programCustomAttributeRepository
      .createQueryBuilder('programCustomAttribute')
      .where({ program: { id: programId } });

    if (filterShowInPeopleAffectedTable) {
      queryCustomAttr = queryCustomAttr.andWhere({
        showInPeopleAffectedTable: true,
      });
    }
    const rawCustomAttributes = await queryCustomAttr.getMany();
    const customAttributes = rawCustomAttributes.map((c) => {
      return {
        name: c.name,
        type: c.type,
        label: c.label,
        questionType: QuestionType.programCustomAttribute,
      };
    });

    return customAttributes;
  }
  private async getAndMapProgramFspQuestions(
    programId: number,
    filterShowInPeopleAffectedTable?: boolean,
  ): Promise<Attribute[]> {
    const program = await this.programRepository.findOne({
      where: { id: programId },
      relations: ['financialServiceProviders'],
    });
    const fspIds = program.financialServiceProviders.map((f) => f.id);

    let queryFspAttributes = this.fspQuestionRepository
      .createQueryBuilder('fspAttribute')
      .where({ fspId: In(fspIds) });

    if (filterShowInPeopleAffectedTable) {
      queryFspAttributes = queryFspAttributes.andWhere({
        showInPeopleAffectedTable: true,
      });
    }
    const rawFspAttributes = await queryFspAttributes.getMany();
    const fspAttributes = rawFspAttributes.map((c) => {
      return {
        name: c.name,
        type: c.answerType,
        label: c.label,
        questionType: QuestionType.fspQuestion,
      };
    });
    return fspAttributes;
  }
}
