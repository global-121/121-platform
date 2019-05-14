import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CriteriumEntity } from './criterium.entity';
//import { UserEntity } from '../user/user.entity';
import { CreateCriteriumDto } from './dto';

@Injectable()
export class CriteriumService {
  constructor(
    @InjectRepository(CriteriumEntity)
    private readonly criteriumRepository: Repository<CriteriumEntity>,
    //@InjectRepository(UserEntity)
    //private readonly userRepository: Repository<UserEntity>
  ) {}

  async findAll(): Promise<CriteriumEntity[]> {
    return await this.criteriumRepository.find();
  }

  async create(criteriumData: CreateCriteriumDto): Promise<CriteriumEntity> {

    let criterium = new CriteriumEntity();
    criterium.criterium = criteriumData.criterium;
    criterium.answerType = criteriumData.answerType;

    const newCriterium = await this.criteriumRepository.save(criterium);

    return newCriterium;

  }
}
