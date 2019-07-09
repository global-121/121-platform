import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CriteriumEntity } from './criterium.entity';
import { UserEntity } from '../user/user.entity';
import { CreateCriteriumDto } from './dto';
import { CountryEntity } from '../country/country.entity';

@Injectable()
export class CriteriumService {
  @InjectRepository(CriteriumEntity)
  private readonly criteriumRepository: Repository<CriteriumEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(CountryEntity)
  private readonly countryRepository: Repository<CountryEntity>;
  public constructor() {}

  public async findAll(): Promise<CriteriumEntity[]> {
    return await this.criteriumRepository.find();
  }

  public async find(countryId: number): Promise<CriteriumEntity[]> {
    const country = await this.countryRepository.findOne(countryId);
    return await this.criteriumRepository
      .createQueryBuilder('table')
      .where('table.id IN (:...criteriums)', {
        criteriums: country.criteriumIds,
      })
      .getMany();
  }

  public async create(
    userId: number,
    criteriumData: CreateCriteriumDto,
  ): Promise<CriteriumEntity> {
    let criterium = new CriteriumEntity();
    criterium.criterium = criteriumData.criterium;
    criterium.answerType = criteriumData.answerType;
    criterium.criteriumType = criteriumData.criteriumType;

    // const author = await this.userRepository.findOne(userId);
    criterium.author = null;
    const newCriterium = await this.criteriumRepository.save(criterium);

    return newCriterium;
  }
}
