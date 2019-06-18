import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OptionEntity } from './option.entity';
import { CreateOptionDto } from './dto';
import { CriteriumEntity } from '../criterium/criterium.entity';

@Injectable()
export class OptionService {
  constructor(
    @InjectRepository(OptionEntity)
    private readonly optionRepository: Repository<OptionEntity>,
    @InjectRepository(CriteriumEntity)
    private readonly criteriumRepository: Repository<CriteriumEntity>,
  ) {}

  async findAll(): Promise<OptionEntity[]> {
    return await this.optionRepository.find();
  }

  async create(
    criteriumId: number,
    optionData: CreateOptionDto,
  ): Promise<OptionEntity> {
    let option = new OptionEntity();
    option.option = optionData.option;

    const criterium = await this.criteriumRepository.findOne(criteriumId);
    option.criterium = criterium;
    const newOption = await this.optionRepository.save(option);

    return newOption;
  }
}
