import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, DeleteResult } from 'typeorm';
import { Injectable } from '@nestjs/common';
// import { EnrollmentEntity } from './enrollment.entity';
import { ProgramEntity } from '../programs/program/program.entity';
import { CustomCriterium } from '../programs/program/custom-criterium.entity';

@Injectable()
export class EnrollmentService {

  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(CustomCriterium)
  private readonly customCriteriumRepository: Repository<CustomCriterium>;

  public constructor() {}

  public async getProofRequest(programId: number): Promise<CustomCriterium[]> {
    // let program = this.programRepository.findOne(programId);
    let criteriums = this.customCriteriumRepository.find({where: {programId: programId}});
    return await criteriums;
  }

  // public async submitAnswers(programId: number): {
  //   let criteriums = this.customCriteriumRepository.find({where: {programId: programId}});
  // }
}
