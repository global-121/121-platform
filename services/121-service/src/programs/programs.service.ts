import { ProgramQuestionEntity } from './program-question.entity';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository } from 'typeorm';
import { ProgramEntity } from './program.entity';
import { ProgramPhase } from '../shared/enum/program-phase.model';
import { CreateProgramDto } from './dto/create-program.dto';
import { ProgramsRO, SimpleProgramRO } from './program.interface';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { ActionEntity } from '../actions/action.entity';
import { UpdateProgramQuestionDto } from './dto/update-program-question.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { FspAttributeEntity } from '../fsp/fsp-attribute.entity';
import { ProgramCustomAttributeEntity } from './program-custom-attribute.entity';
import { UpdateProgramCustomAttributesDto } from './dto/update-program-custom-attribute.dto';

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
  @InjectRepository(FspAttributeEntity)
  public fspAttributeRepository: Repository<FspAttributeEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  public financialServiceProviderRepository: Repository<
    FinancialServiceProviderEntity
  >;
  @InjectRepository(TransactionEntity)
  public transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(ActionEntity)
  public actionRepository: Repository<ActionEntity>;

  public constructor() {}

  public async findOne(where): Promise<ProgramEntity> {
    const program = await this.programRepository.findOne(where, {
      relations: [
        'programQuestions',
        'aidworkerAssignments',
        'aidworkerAssignments.user',
        'aidworkerAssignments.roles',
        'financialServiceProviders',
        'programCustomAttributes',
      ],
    });
    return program;
  }

  public async findAll(): Promise<ProgramsRO> {
    const qb = await getRepository(ProgramEntity)
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.programQuestions', 'programQuestion')
      .addOrderBy('programQuestion.id', 'ASC');

    qb.where('1 = 1');
    qb.orderBy('program.created', 'DESC');

    const programs = await qb.getMany();
    const programsCount = programs.length;

    return { programs, programsCount };
  }

  public async getPublishedPrograms(): Promise<ProgramsRO> {
    let programs = (await this.findAll()).programs;
    programs = programs.filter(program => program.published);
    const programsCount = programs.length;
    return { programs, programsCount };
  }

  public async create(programData: CreateProgramDto): Promise<ProgramEntity> {
    console.log('programData: ', programData);
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
    program.inclusionCalculationType = programData.inclusionCalculationType;
    program.minimumScore = programData.minimumScore;
    program.highestScoresX = programData.highestScoresX;
    program.meetingDocuments = programData.meetingDocuments;
    program.notifications = programData.notifications;
    program.phoneNumberPlaceholder = programData.phoneNumberPlaceholder;
    program.description = programData.description;
    program.descCashType = programData.descCashType;
    program.validation = programData.validation;
    program.validationByQr = programData.validationByQr;
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
    const program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = `No program found with id ${programId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (let attribute in updateProgramDto) {
      program[attribute] = updateProgramDto[attribute];
    }

    await this.programRepository.save(program);
    return program;
  }

  public async updateProgramCustomAttributes(
    programId: number,
    updateProgramCustomAttributes: UpdateProgramCustomAttributesDto,
  ): Promise<ProgramCustomAttributeEntity[]> {
    const savedAttributes: ProgramCustomAttributeEntity[] = [];
    let program = await this.programRepository.findOne(programId, {
      relations: ['programCustomAttributes'],
    });

    for (const attribute of updateProgramCustomAttributes.attributes) {
      const oldAttribute = await this.programCustomAttributeRepository.findOne({
        where: { name: attribute.name },
      });
      if (oldAttribute) {
        // If existing: update ..
        oldAttribute.type = attribute.type;
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
        const customAttributeEntity = new ProgramCustomAttributeEntity();
        customAttributeEntity.label = JSON.parse(attribute.label);
        customAttributeEntity.type = attribute.type;
        customAttributeEntity.name = attribute.name;
        const savedAttribute = await this.programCustomAttributeRepository.save(
          customAttributeEntity,
        );
        savedAttributes.push(savedAttribute);
        program.programCustomAttributes.push(savedAttribute);
      }
    }
    await this.programRepository.save(program);
    return savedAttributes;
  }

  public async updateProgramQuestion(
    updateProgramQuestionDto: UpdateProgramQuestionDto,
  ): Promise<ProgramQuestionEntity> {
    const programQuestion = await this.programQuestionRepository.findOne({
      where: { name: updateProgramQuestionDto.name },
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
}
