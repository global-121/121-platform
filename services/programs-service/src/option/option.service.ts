import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OptionEntity } from './option.entity';
//import { UserEntity } from '../user/user.entity';
import { CreateOptionDto } from './dto';

@Injectable()
export class OptionService {
  constructor(
    @InjectRepository(OptionEntity)
    private readonly optionRepository: Repository<OptionEntity>,
    //@InjectRepository(UserEntity)
    //private readonly userRepository: Repository<UserEntity>
  ) {}

  async findAll(): Promise<OptionEntity[]> {
    return await this.optionRepository.find();
  }

  async create(optionData: CreateOptionDto): Promise<OptionEntity> {

    let option = new OptionEntity();
    option.option = optionData.option;

    const newOption = await this.optionRepository.save(option);

    return newOption;

  }
}
