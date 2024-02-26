import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator } from 'nestjs-paginate';
import { In, Repository } from 'typeorm';
import { FinancialServiceProviderAttributeEntity } from '../financial-service-providers/financial-service-provider-attribute.entity';
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
  @InjectRepository(FinancialServiceProviderAttributeEntity)
  private readonly fspQuestionRepository: Repository<FinancialServiceProviderAttributeEntity>;

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
      'fspDisplayNamePortal',
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
    phase?: string,
  ): Promise<Attribute[]> {
    let customAttributes = [];
    if (includeCustomAttributes) {
      customAttributes = await this.getAndMapProgramCustomAttributes(
        programId,
        phase,
      );
    }
    let programQuestions = [];
    if (includeProgramQuestions) {
      programQuestions = await this.getAndMapProgramQuestions(programId, phase);
    }
    let fspQuestions = [];
    if (includeFspQuestions) {
      fspQuestions = await this.getAndMapProgramFspQuestions(programId, phase);
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
        name: 'fspDisplayNamePortal',
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
        shortLabel: c.label,
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
        shortLabel: c.shortLabel,
      };
    });

    return [...customAttributes, ...programQuestions];
  }

  private async getAndMapProgramQuestions(
    programId: number,
    phase?: string,
  ): Promise<Attribute[]> {
    let queryProgramQuestions = this.programQuestionRepository
      .createQueryBuilder('programQuestion')
      .where({ program: { id: programId } });

    if (phase) {
      queryProgramQuestions = queryProgramQuestions.andWhere(
        'programQuestion.phases ::jsonb ?| :phases',
        { phases: [phase] },
      );
    }
    const rawProgramQuestions = await queryProgramQuestions.getMany();
    const programQuestions = rawProgramQuestions.map((c) => {
      return {
        name: c.name,
        type: c.answerType,
        label: c.label,
        shortLabel: c.shortLabel,
        questionType: QuestionType.programQuestion,
      };
    });

    return programQuestions;
  }
  private async getAndMapProgramCustomAttributes(
    programId: number,
    phase?: string,
  ): Promise<Attribute[]> {
    let queryCustomAttr = this.programCustomAttributeRepository
      .createQueryBuilder('programCustomAttribute')
      .where({ program: { id: programId } });

    if (phase) {
      queryCustomAttr = queryCustomAttr.andWhere(
        'programCustomAttribute.phases ::jsonb ?| :phases',
        { phases: [phase] },
      );
    }
    const rawCustomAttributes = await queryCustomAttr.getMany();
    const customAttributes = rawCustomAttributes.map((c) => {
      return {
        name: c.name,
        type: c.type,
        label: c.label,
        shortLabel: c.label,
        questionType: QuestionType.programCustomAttribute,
      };
    });

    return customAttributes;
  }
  private async getAndMapProgramFspQuestions(
    programId: number,
    phase?: string,
  ): Promise<Attribute[]> {
    const program = await this.programRepository.findOne({
      where: { id: programId },
      relations: ['financialServiceProviders'],
    });
    const fspIds = program.financialServiceProviders.map((f) => f.id);

    let queryFspAttributes = this.fspQuestionRepository
      .createQueryBuilder('fspAttribute')
      .where({ fspId: In(fspIds) });

    if (phase) {
      queryFspAttributes = queryFspAttributes.andWhere(
        'fspAttribute.phases ::jsonb ?| :phases',
        { phases: [phase] },
      );
    }
    const rawFspAttributes = await queryFspAttributes.getMany();
    const fspAttributes = rawFspAttributes.map((c) => {
      return {
        name: c.name,
        type: c.answerType,
        label: c.label,
        shortLabel: c.shortLabel,
        questionType: QuestionType.fspQuestion,
      };
    });
    return fspAttributes;
  }
}
