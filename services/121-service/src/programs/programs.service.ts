import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, In, Repository } from 'typeorm';
import { ActionEntity } from '../actions/action.entity';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { Attribute } from '../registration/enum/custom-data-attributes';
import { ProgramPhase } from '../shared/enum/program-phase.model';
import { UserEntity } from '../user/user.entity';
import { CreateProgramCustomAttributesDto } from './dto/create-program-custom-attribute.dto';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramQuestionDto } from './dto/update-program-question.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramCustomAttributeEntity } from './program-custom-attribute.entity';
import { ProgramQuestionEntity } from './program-question.entity';
import { ProgramEntity } from './program.entity';
import { ProgramsRO, SimpleProgramRO } from './program.interface';
@Injectable()
export class ProgramService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramQuestionEntity)
  public programQuestionRepository: Repository<ProgramQuestionEntity>;
  @InjectRepository(ProgramCustomAttributeEntity)
  public programCustomAttributeRepository: Repository<
    ProgramCustomAttributeEntity
  >;
  @InjectRepository(FspQuestionEntity)
  public fspAttributeRepository: Repository<FspQuestionEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  public financialServiceProviderRepository: Repository<
    FinancialServiceProviderEntity
  >;
  @InjectRepository(TransactionEntity)
  public transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(ActionEntity)
  public actionRepository: Repository<ActionEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;

  public constructor() {}

  public async findOne(where): Promise<ProgramEntity> {
    const program = await this.programRepository.findOne(where, {
      relations: [
        'programQuestions',
        'aidworkerAssignments',
        'aidworkerAssignments.user',
        'aidworkerAssignments.roles',
        'financialServiceProviders',
        'financialServiceProviders.questions',
        'programCustomAttributes',
      ],
    });
    if (program) {
      program.editableAttributes = await this.getPaEditableAttributes(
        program.id,
      );
    }
    return program;
  }

  public async getPublishedPrograms(): Promise<ProgramsRO> {
    const programs = await getRepository(ProgramEntity)
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.programQuestions', 'programQuestion')
      .where('program.published = :published', { published: true })
      .orderBy('program.created', 'DESC')
      .addOrderBy('programQuestion.id', 'ASC')
      .getMany();
    const programsCount = programs.length;
    return { programs, programsCount };
  }

  public async findUserProgramAssignmentsOrThrow(
    userId: number,
  ): Promise<UserEntity> {
    const user = await this.userRepository.findOne(userId, {
      relations: ['programAssignments', 'programAssignments.program'],
    });
    if (
      !user ||
      !user.programAssignments ||
      user.programAssignments.length === 0
    ) {
      const errors = 'User not found or no assigned programs';
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  public async getAssignedPrograms(userId: number): Promise<ProgramsRO> {
    const user = await this.findUserProgramAssignmentsOrThrow(userId);
    const programIds = user.programAssignments.map(p => p.program.id);
    const programs = await this.programRepository.findByIds(programIds, {
      relations: ['programQuestions'],
    });
    const programsCount = programs.length;

    return { programs, programsCount };
  }

  public async create(programData: CreateProgramDto): Promise<ProgramEntity> {
    let program = new ProgramEntity();
    program.location = programData.location;
    program.ngo = programData.ngo;
    program.titlePortal = programData.titlePortal;
    program.titlePaApp = programData.titlePaApp;
    program.startDate = programData.startDate;
    program.endDate = programData.endDate;
    program.currency = programData.currency;
    program.distributionFrequency = programData.distributionFrequency;
    program.distributionDuration = programData.distributionDuration;
    program.fixedTransferValue = programData.fixedTransferValue;
    program.paymentAmountMultiplierFormula =
      programData.paymentAmountMultiplierFormula;
    program.inclusionCalculationType = programData.inclusionCalculationType;
    program.minimumScore = programData.minimumScore;
    program.highestScoresX = programData.highestScoresX;
    program.meetingDocuments = programData.meetingDocuments;
    program.notifications = programData.notifications;
    program.phoneNumberPlaceholder = programData.phoneNumberPlaceholder;
    program.description = programData.description;
    program.descCashType = programData.descCashType;
    program.validation = programData.validation;
    program.programQuestions = [];
    program.financialServiceProviders = [];

    for (let customAttribute of programData.programCustomAttributes) {
      let customAttributeReturn = await this.programCustomAttributeRepository.save(
        customAttribute,
      );
      program.programCustomAttributes.push(customAttributeReturn);
    }
    for (let programQuestion of programData.programQuestions) {
      let programQuestionReturn = await this.programQuestionRepository.save(
        programQuestion,
      );
      program.programQuestions.push(programQuestionReturn);
    }
    for (let item of programData.financialServiceProviders) {
      let fsp = await this.financialServiceProviderRepository.findOne({
        relations: ['program'],
        where: { id: item.id },
      });
      if (!fsp) {
        const errors = `No fsp found with id ${item.id}`;
        throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
      }
      fsp.program.push(program);
      await this.financialServiceProviderRepository.save(fsp);
    }

    const newProgram = await this.programRepository.save(program);
    return newProgram;
  }

  public async updateProgram(
    programId: number,
    updateProgramDto: UpdateProgramDto,
  ): Promise<ProgramEntity> {
    const program = await this.findProgramOrThrow(programId);

    for (let attribute in updateProgramDto) {
      program[attribute] = updateProgramDto[attribute];
    }

    await this.programRepository.save(program);
    return program;
  }

  public async findProgramOrThrow(programId): Promise<ProgramEntity> {
    const program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = `No program found with id ${programId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return program;
  }

  public async updateProgramCustomAttributes(
    programId: number,
    updateProgramCustomAttributes: CreateProgramCustomAttributesDto,
  ): Promise<ProgramCustomAttributeEntity[]> {
    const savedAttributes: ProgramCustomAttributeEntity[] = [];
    let program = await this.programRepository.findOne(programId, {
      relations: ['programCustomAttributes'],
    });

    for (const attribute of updateProgramCustomAttributes.attributes) {
      const oldAttribute = await this.programCustomAttributeRepository.findOne({
        where: { name: attribute.name, programId: programId },
      });
      if (oldAttribute) {
        // If existing: update ..
        oldAttribute.type = attribute.type;
        oldAttribute.label = attribute.label;
        const savedAttribute = await this.programCustomAttributeRepository.save(
          oldAttribute,
        );
        savedAttributes.push(savedAttribute);
        const attributeIndex = program.programCustomAttributes.findIndex(
          attr => attr.id === savedAttribute.id,
        );
        program.programCustomAttributes[attributeIndex] = savedAttribute;
      } else {
        // .. otherwise, create new
        const newCustomAttribute = attribute as ProgramCustomAttributeEntity;
        newCustomAttribute.programId = programId;

        // attribute.programId = programId;
        const savedAttribute = await this.programCustomAttributeRepository.save(
          newCustomAttribute,
        );
        savedAttributes.push(savedAttribute);
        program.programCustomAttributes.push(savedAttribute);
      }
    }
    await this.programRepository.save(program);
    return savedAttributes;
  }

  public async updateProgramQuestion(
    programId: number,
    updateProgramQuestionDto: UpdateProgramQuestionDto,
  ): Promise<ProgramQuestionEntity> {
    const programQuestion = await this.programQuestionRepository.findOne({
      where: { name: updateProgramQuestionDto.name, programId: programId },
    });
    if (!programQuestion) {
      const errors = `No programQuestion found with name ${updateProgramQuestionDto.name}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (let attribute in updateProgramQuestionDto) {
      if (attribute !== 'name') {
        programQuestion[attribute] = updateProgramQuestionDto[attribute];
      }
    }

    await this.programQuestionRepository.save(programQuestion);
    return programQuestion;
  }

  public async deleteProgramQuestion(
    programId: number,
    programQuestionId: number,
  ): Promise<ProgramQuestionEntity> {
    await this.findProgramOrThrow(programId);

    const programQuestion = await this.programQuestionRepository.findOne({
      where: { id: Number(programQuestionId) },
    });
    if (!programQuestion) {
      const errors = `Program question with id: '${programQuestionId}' not found.'`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return await this.programQuestionRepository.remove(programQuestion);
  }

  public async changePhase(
    programId: number,
    newPhase: ProgramPhase,
  ): Promise<SimpleProgramRO> {
    const oldPhase = (await this.programRepository.findOne(programId)).phase;
    await this.changeProgramValue(programId, {
      phase: newPhase,
    });
    const changedProgram = await this.findOne(programId);
    if (
      oldPhase === ProgramPhase.design &&
      newPhase === ProgramPhase.registrationValidation
    ) {
      await this.publish(programId);
    }
    return this.buildProgramRO(changedProgram);
  }

  public async publish(programId: number): Promise<SimpleProgramRO> {
    const selectedProgram = await this.findOne(programId);
    if (selectedProgram.published == true) {
      const errors = { Program: ' already published' };
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    await this.changeProgramValue(programId, { published: true });

    const changedProgram = await this.findOne(programId);
    return await this.buildProgramRO(changedProgram);
  }

  private async changeProgramValue(
    programId: number,
    change: object,
  ): Promise<void> {
    await getRepository(ProgramEntity)
      .createQueryBuilder()
      .update(ProgramEntity)
      .set(change)
      .where('id = :id', { id: programId })
      .execute();
  }

  private buildProgramRO(program: ProgramEntity): SimpleProgramRO {
    const simpleProgramRO = {
      id: program.id,
      titlePortal: program.titlePortal,
      phase: program.phase,
    };

    return simpleProgramRO;
  }

  public async getPaTableAttributes(
    programId: number,
    phase?: ProgramPhase,
  ): Promise<Attribute[]> {
    let queryCustomAttr = getRepository(ProgramCustomAttributeEntity)
      .createQueryBuilder('programCustomAttribute')
      .where({ program: { id: programId } });

    if (phase) {
      queryCustomAttr = queryCustomAttr.andWhere(
        'programCustomAttribute.phases ::jsonb ?| :phases',
        { phases: [phase] },
      );
    }
    const rawCustomAttributes = await queryCustomAttr.getMany();
    const customAttributes = rawCustomAttributes.map(c => {
      return {
        name: c.name,
        type: c.type,
        label: c.label,
        shortLabel: c.label,
      };
    });

    let queryProgramQuestions = getRepository(ProgramQuestionEntity)
      .createQueryBuilder('programQuestion')
      .where({ program: { id: programId } });

    if (phase) {
      queryProgramQuestions = queryProgramQuestions.andWhere(
        'programQuestion.phases ::jsonb ?| :phases',
        { phases: [phase] },
      );
    }
    const rawProgramQuestions = await queryProgramQuestions.getMany();
    const programQuestions = rawProgramQuestions.map(c => {
      return {
        name: c.name,
        type: c.answerType,
        label: c.label,
        shortLabel: c.shortLabel,
      };
    });

    const program = await this.programRepository.findOne(programId, {
      relations: ['financialServiceProviders'],
    });
    const fspIds = program.financialServiceProviders.map(f => f.id);

    let queryFspAttributes = getRepository(FspQuestionEntity)
      .createQueryBuilder('fspAttribute')
      .where({ fspId: In(fspIds) });

    if (phase) {
      queryFspAttributes = queryFspAttributes.andWhere(
        'fspAttribute.phases ::jsonb ?| :phases',
        { phases: [phase] },
      );
    }
    const rawFspAttributes = await queryFspAttributes.getMany();
    const fspAttributes = rawFspAttributes.map(c => {
      return {
        name: c.name,
        type: c.answerType,
        label: c.label,
        shortLabel: c.shortLabel,
      };
    });

    return [...customAttributes, ...programQuestions, ...fspAttributes];
  }

  private async getPaEditableAttributes(
    programId: number,
  ): Promise<Attribute[]> {
    const customAttributes = (
      await this.programCustomAttributeRepository.find({
        where: { program: { id: programId } },
      })
    ).map(c => {
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
    ).map(c => {
      return {
        name: c.name,
        type: c.answerType,
        label: c.label,
        shortLabel: c.shortLabel,
      };
    });

    const program = await this.programRepository.findOne(programId, {
      relations: ['financialServiceProviders'],
    });
    const fspIds = program.financialServiceProviders.map(f => f.id);

    return [...customAttributes, ...programQuestions];
  }
}
