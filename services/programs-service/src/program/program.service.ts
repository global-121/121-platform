import { CustomCriterium } from './custom-criterium.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, DeleteResult } from 'typeorm';
import { ProgramEntity } from './program.entity';
import { UserEntity } from '../user/user.entity';
import { CreateProgramDto } from './dto';

import { ProgramRO, ProgramsRO } from './program.interface';

@Injectable()
export class ProgramService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(CustomCriterium)
  public customCriteriumRepository: Repository<CustomCriterium>;
  public constructor() {}

  public async findAll(query): Promise<ProgramsRO> {
    const qb = await getRepository(ProgramEntity)
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.author', 'author');

    qb.where('1 = 1');

    if ('tag' in query) {
      qb.andWhere('program.tagList LIKE :tag', { tag: `%${query.tag}%` });
    }

    if ('author' in query) {
      const author = await this.userRepository.findOne({
        username: query.author,
      });
      qb.andWhere('program.authorId = :id', { id: author.id });
    }

    qb.orderBy('program.created', 'DESC');

    const programsCount = await qb.getCount();

    if ('limit' in query) {
      qb.limit(query.limit);
    }

    if ('offset' in query) {
      qb.offset(query.offset);
    }

    const programs = await qb.getMany();

    return { programs, programsCount };
  }

  public async findOne(where): Promise<ProgramRO> {
    const program = await this.programRepository.findOne(where);
    return { program };
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
      console.log(customCriterium);
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
}
