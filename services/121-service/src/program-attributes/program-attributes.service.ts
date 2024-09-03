import { FspQuestionEntity } from '@121-service/src/financial-service-providers/fsp-question.entity';
import { ProgramCustomAttributeEntity } from '@121-service/src/programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '@121-service/src/programs/program-question.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import {
  AllowedFilterOperatorsNumber,
  AllowedFilterOperatorsString,
  PaginateConfigRegistrationViewWithPayments,
} from '@121-service/src/registration/const/filter-operation.const';
import { FilterAttributeDto } from '@121-service/src/registration/dto/filter-attribute.dto';
import {
  Attribute,
  QuestionType,
} from '@121-service/src/registration/enum/custom-data-attributes';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator } from 'nestjs-paginate';
import { Equal, In, Repository } from 'typeorm';
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

  public getFilterableAttributes(program: ProgramEntity) {
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

    const paymentGroup = {
      group: 'payments',
      filters: [
        'failedPayment',
        'waitingPayment',
        'successPayment',
        'notYetSentPayment',
        'paymentCount',
      ],
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
        if (
          PaginateConfigRegistrationViewWithPayments.filterableColumns?.[name]
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
    let customAttributes: Attribute[] = [];
    if (includeCustomAttributes) {
      customAttributes = await this.getAndMapProgramCustomAttributes(
        programId,
        filterShowInPeopleAffectedTable,
      );
    }
    let programQuestions: Attribute[] = [];
    if (includeProgramQuestions) {
      programQuestions = await this.getAndMapProgramQuestions(
        programId,
        filterShowInPeopleAffectedTable,
      );
    }
    let fspQuestions: Attribute[] = [];
    if (includeFspQuestions) {
      fspQuestions = await this.getAndMapProgramFspQuestions(
        programId,
        filterShowInPeopleAffectedTable,
      );
    }

    let templateDefaultAttributes: Attribute[] = [];
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
      where: { id: Equal(programId) },
      select: ['enableMaxPayments'],
    });
    const defaultAttributes: Attribute[] = [
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
    if (hasMaxPayments?.enableMaxPayments) {
      defaultAttributes.push({
        name: 'maxPayments',
        type: 'numeric',
        label: null,
      });
      defaultAttributes.push({
        name: 'paymentCountRemaining',
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
        where: { program: { id: Equal(programId) } },
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
        where: {
          program: { id: Equal(programId) },
          editableInPortal: Equal(true),
        },
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
    const program = await this.programRepository.findOneOrFail({
      where: { id: Equal(programId) },
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
