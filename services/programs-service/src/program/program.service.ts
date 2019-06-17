import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, DeleteResult } from 'typeorm';
import { ProgramEntity } from './program.entity';
import { UserEntity } from '../user/user.entity';
import { CreateProgramDto } from './dto';

import {ProgramRO, ProgramsRO} from './program.interface';
const slug = require('slug');

@Injectable()
export class ProgramService {
  constructor(
    @InjectRepository(ProgramEntity)
    private readonly programRepository: Repository<ProgramEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  async findAll(query): Promise<ProgramsRO> {

    const qb = await getRepository(ProgramEntity)
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.author', 'author');

    qb.where("1 = 1");

    if ('tag' in query) {
      qb.andWhere("program.tagList LIKE :tag", { tag: `%${query.tag}%` });
      console.log("Ik ben hier")
    }

    if ('author' in query) {
      const author = await this.userRepository.findOne({username: query.author});
      qb.andWhere("program.authorId = :id", { id: author.id });
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

    return {programs, programsCount};
  }

  async findOne(where): Promise<ProgramRO> {
    const program = await this.programRepository.findOne(where);
    return {program};
  }

  async create(userId: number, programData: CreateProgramDto): Promise<ProgramEntity> {

    let program = new ProgramEntity();
    program.title = programData.title;
    program.description = programData.description;
    program.countryId = programData.countryId;

    const author = await this.userRepository.findOne(userId);
    program.author = author;

    const newProgram = await this.programRepository.save(program);

    // if (Array.isArray(author.programs)) {
    //   author.programs.push(program);
    // } else {
    //   author.programs = [program];
    // }

    // await this.userRepository.save(author);

    return newProgram;

  }

  async update(id: number, programData: any): Promise<ProgramRO> {
    let toUpdate = await this.programRepository.findOne({ id: id});
    let updated = Object.assign(toUpdate, programData);
    const program = await this.programRepository.save(updated);
    return {program};
  }

  async delete(programId: number): Promise<DeleteResult> {
    return await this.programRepository.delete(programId);
  }
}
