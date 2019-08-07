import { ConnectionEntity } from './../../sovrin/create-connection/connection.entity';
import { CustomCriterium } from './custom-criterium.entity';
import { Injectable, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, DeleteResult } from 'typeorm';
import { ProgramEntity } from './program.entity';
import { UserEntity } from '../../user/user.entity';
import { CreateProgramDto } from './dto';

import { ProgramRO, ProgramsRO, SimpleProgramRO } from './program.interface';
import { SchemaService } from '../../sovrin/schema/schema.service';
import proofRequestExample from '../../../examples/proof_request.json';

@Injectable()
export class ProgramService {
  @InjectRepository(ConnectionEntity)
  private readonly connectionRepository: Repository<ConnectionEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(CustomCriterium)
  public customCriteriumRepository: Repository<CustomCriterium>;
  public constructor() {}

  public async findOne(where): Promise<ProgramEntity> {
    const qb = await getRepository(ProgramEntity)
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.customCriteria', 'customCriterium');
    qb.whereInIds([where]);
    const program = qb.getOne();
    return program;
  }

  public async findAll(query): Promise<ProgramsRO> {
    const qb = await getRepository(ProgramEntity)
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.customCriteria', 'customCriterium');

    qb.where('1 = 1');

    if ('location' in query) {
      qb.andWhere('lower(program.location) LIKE :location', {
        location: `%${query.location.toLowerCase()}%`,
      });
    }

    if ('countryId' in query) {
      qb.andWhere('program.countryId = :countryId', {
        countryId: query.countryId,
      });
    }

    qb.orderBy('program.created', 'DESC');

    const programsCount = await qb.getCount();
    const programs = await qb.getMany();

    return { programs, programsCount };
  }

  public async findByCountry(query): Promise<ProgramsRO> {
    const qb = await getRepository(ProgramEntity)
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.customCriteria', 'customCriterium')
      .where('"countryId" = :countryId', { countryId: query })
      .andWhere('published = true');

    const programsCount = await qb.getCount();
    const programs = await qb.getMany();
    return { programs, programsCount };
  }

  public async create(
    userId: number,
    programData: CreateProgramDto,
  ): Promise<ProgramEntity> {
    let program = new ProgramEntity();
    program.location = programData.location;
    program.title = programData.title;
    program.startDate = programData.startDate;
    program.endDate = programData.endDate;
    program.currency = programData.currency;
    program.distributionFrequency = programData.distributionFrequency;
    program.distributionChannel = programData.distributionChannel;
    program.notifiyPaArea = programData.notifiyPaArea;
    program.notificationType = programData.notificationType;
    program.cashDistributionSites = programData.cashDistributionSites;
    program.financialServiceProviders = programData.financialServiceProviders;
    program.inclusionCalculationType = programData.inclusionCalculationType;
    program.minimumScore = programData.minimumScore;
    program.description = programData.description;
    program.countryId = programData.countryId;
    program.customCriteria = [];

    const author = await this.userRepository.findOne(userId);
    program.author = author;

    for (let customCriterium of programData.customCriteria) {
      let customReturn = await this.customCriteriumRepository.save(
        customCriterium,
      );
      program.customCriteria.push(customReturn);
    }

    const newProgram = await this.programRepository.save(program);
    return newProgram;
  }

  public async update(id: number, programData: any): Promise<ProgramRO> {
    let toUpdate = await this.programRepository.findOne({ id: id });
    let updated = Object.assign(toUpdate, programData);
    const program = await this.programRepository.save(updated);
    return { program };
  }

  public async delete(programId: number): Promise<DeleteResult> {
    return await this.programRepository.delete(programId);
  }

  public async publish(programId: number): Promise<SimpleProgramRO> {
    const selectedProgram = await this.findOne(programId);
    if (selectedProgram.published == true) {
      const errors = { Program: ' already published' };
      throw new HttpException({ errors }, 401);
    }

    await this.changeProgramValue(programId, { published: true });

    const schemaService = new SchemaService();

    const result = await schemaService.create(selectedProgram);
    await this.changeProgramValue(programId, { schemaId: result.schemaId });
    await this.changeProgramValue(programId, { credDefId: result.credDefId });

    return await this.buildProgramRO(selectedProgram);
  }

  public async unpublish(programId: number): Promise<SimpleProgramRO> {
    let selectedProgram = await this.findOne(programId);
    if (selectedProgram.published == false) {
      const errors = { Program: ' already unpublished' };
      throw new HttpException({ errors }, 401);
    }
    await this.changeProgramValue(programId, { published: false });
    return await this.buildProgramRO(selectedProgram);
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
      title: program.title,
      published: program.published,
    };

    return simpleProgramRO;
  }

  public async getInclusionStatus(
    programId: number,
    did: string,
  ): Promise<any> {
    let connection = await this.connectionRepository.findOne({
      where: { did: did },
    });
    if (!connection) {
      const errors = 'No connection found for PA.';
      throw new HttpException({ errors }, 400);
    }
    let program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, 400);
    }

    let inclusionStatus: number;
    if (
      connection.programsIncluded.indexOf(parseInt(String(programId), 10)) > -1
    ) {
      inclusionStatus = 1;
    } else if (
      connection.programsEnrolled.indexOf(parseInt(String(programId), 10)) > -1
    ) {
      inclusionStatus = 0;
    } else {
      const errors = 'PA not enrolled in this program yet.';
      throw new HttpException({ errors }, 400);
    }
    return inclusionStatus;
  }

  public async calculateInclusion(programId, proof, did): Promise<boolean> {
    const currentProgram = await this.findOne(programId);
    const programCriteria = currentProgram.customCriteria;
    const revealedAttrProof = proof['requested_proof']['revealed_attrs'];
    const proofRequest = proofRequestExample;
    const attrRequest = proofRequest['requested_attributes'];

    const scoreList = this.createCriteriaScoreList(
      revealedAttrProof,
      attrRequest,
    );

    const totalScore = this.calculateScoreAllCriteria(
      programCriteria,
      scoreList,
    );

    const included = totalScore >= currentProgram.minimumScore;
    return included;
  }

  private createCriteriaScoreList(revealedAttrProof, attrRequest): object {
    const inclusionCriteriaAnswers = {};
    for (let attrKey in revealedAttrProof) {
      let attrValue = revealedAttrProof[attrKey];
      let newKeyName = attrRequest[attrKey]['name'];
      inclusionCriteriaAnswers[newKeyName] = attrValue['raw'];
    }
    return inclusionCriteriaAnswers;
  }

  private calculateScoreAllCriteria(programCriteria, scoreList): number {
    let totalScore = 0;
    for (let criterium of programCriteria) {
      let criteriumName = criterium.criterium;
      if (scoreList[criteriumName]) {
        let answerPA = scoreList[criteriumName];
        switch (criterium.answerType) {
          case 'dropdown': {
            totalScore =
              totalScore + this.getScoreForDropDown(criterium, answerPA);
          }
          case 'numeric':
            totalScore =
              totalScore + this.getScoreForNumeric(criterium, answerPA);
        }
      }
    }
    return totalScore;
  }

  private getScoreForDropDown(criterium, answerPA): number {
    let score = 0;
    for (let value of criterium.options.options) {
      if (value.option === answerPA) {
        score = criterium.scoring[value.id];
      }
    }
    return score;
  }

  private getScoreForNumeric(criterium, answerPA): number {
    let score = 0;
    if (criterium.scoring.multiplier) {
      score = criterium.scoring.multiplier * answerPA;
    }
    return score;
  }
}
